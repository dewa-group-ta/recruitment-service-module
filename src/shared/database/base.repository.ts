import {
  DataSource,
  EntityTarget,
  FindOptionsRelations,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder
} from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import {
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException
} from "@nestjs/common";
import { BaseFindAllDto } from "../paginate/base-find-all.dto";
import { PaginationOptions } from "./database.constant";
import * as utils from "./database.utils";
import { Pagination } from "../paginate";

export abstract class BaseRepository<
  T extends ObjectLiteral
> extends Repository<T> {
  public readonly repository: Repository<T>;
  protected readonly alias: string;
  public readonly entityName: string;
  protected readonly logger = new Logger(`${this.constructor.name}`);

  private readonly prebuiltQueries: Map<
    string,
    (builder: SelectQueryBuilder<T>, alias: string) => SelectQueryBuilder<T>
  > = new Map();

  constructor(entity: EntityTarget<T>, dataSource: DataSource) {
    super(entity, dataSource.createEntityManager());
    this.repository = dataSource.getRepository(entity);
    this.alias = dataSource.getMetadata(entity).targetName.toLocaleLowerCase();
    this.entityName = this.alias.charAt(0).toUpperCase() + this.alias.slice(1);

    this.initializePrebuiltQueries();
  }

  /**
   * Register a prebuilt query for reuse.
   *
   * @param name - The name of the prebuilt query.
   * @param builderFunction - The function to build the query.
   * @example
   * ```typescript
   * this.registerPrebuiltQuery("dashboardStats", (builder, alias) => {
   *   return builder
   *     .select([
   *       `${alias}.status`,
   *       `COUNT(${alias}.id) as count`,
   *       `role.name as roleName`,
   *     ])
   *     .leftJoin(`${alias}.role`, "role")
   *     .groupBy(`${alias}.status, role.name`);
   * });
   *
   * // Usage in paginateWithPrebuiltQuery
   * const stats = await this.paginateWithPrebuiltQuery("dashboardStats", dto, {
   * searchCriteria: ["status", "role.name"]
   * relations: ["role"],
   * query: {}
   * });
   * ```
   */
  protected registerPrebuiltQuery(
    name: string,
    builderFunction: (
      builder: SelectQueryBuilder<T>,
      alias: string
    ) => SelectQueryBuilder<T>
  ): void {
    this.prebuiltQueries.set(name, builderFunction);
  }

  protected getPrebuiltQuery(
    name: string
  ): utils.PrebuiltQueryBuilder<T> | null {
    const builderFunction = this.prebuiltQueries.get(name);
    if (!builderFunction) {
      this.logger.warn(`Prebuilt query '${name}' not found`);
      return null;
    }
    return new utils.PrebuiltQueryBuilder(
      this.repository,
      this.alias,
      builderFunction
    );
  }

  protected initializePrebuiltQueries(): void {
    //NOSONAR
  }

  private buildPaginateQuery(
    builder: SelectQueryBuilder<T>,
    dto: BaseFindAllDto,
    options?: PaginationOptions<T>
  ): SelectQueryBuilder<T> {
    if (options?.relations && options.relations.length > 0) {
      options.relations.forEach((relation) => {
        const relationParts = relation.split(".");
        const relationAlias = relationParts[relationParts.length - 1];
        const property = !relation.includes(".")
          ? `${this.alias}.${relation}`
          : relation;

        this.logger.log(`Joining relation: ${property} as ${relationAlias}`);
        builder = builder.leftJoinAndSelect(property, relationAlias);
      });
    }

    if (options?.query?.select) {
      builder = options.query.select(builder, this.alias);
    }

    if (options?.query?.join) {
      builder = options.query.join(builder, this.alias);
    }

    if (
      options?.searchCriteria &&
      options.searchCriteria.length > 0 &&
      dto.keyword
    ) {
      const whereExpressions = options.searchCriteria.map((criteria, index) => {
        const paramName = `keyword${index}`;
        return `${criteria} ILIKE :${paramName}`;
      });

      const whereClause = whereExpressions.join(" OR ");

      const parameters = options.searchCriteria.reduce(
        (acc, _, index) => {
          acc[`keyword${index}`] = `%${dto.keyword}%`;
          return acc;
        },
        {} as Record<string, string>
      );

      builder = builder.andWhere(`(${whereClause})`, parameters);
    }

    if (options?.query?.groupBy) {
      builder = options.query.groupBy(builder, this.alias);
    }

    if (options?.query?.having) {
      builder = options.query.having(builder, this.alias);
    }

    return builder;
  }

  private async applyWhereConditions(
    builder: SelectQueryBuilder<T>,
    dto: BaseFindAllDto,
    options?: PaginationOptions<T>
  ): Promise<SelectQueryBuilder<T>> {
    if (options?.query?.where) {
      return await options.query.where(builder, dto, this.alias);
    }
    return builder;
  }

  private applyOrderBy(
    builder: SelectQueryBuilder<T>,
    dto: BaseFindAllDto,
    options?: PaginationOptions<T>
  ): SelectQueryBuilder<T> {
    if (options?.query?.orderBy) {
      return options.query.orderBy(builder, dto, this.alias);
    }

    const allowedSortBy = options?.query?.allowedSortBy || [
      "createdAt",
      "updatedAt",
      "id"
    ];

    if (dto?.sort_by && !allowedSortBy.includes(dto.sort_by)) {
      this.logger.warn(`Invalid sort_by value: ${dto.sort_by}`);
      throw new BadRequestException(
        `Invalid sort_by value, allowed values are: ${allowedSortBy.join(", ")}`
      );
    }

    if (dto?.sort_by) {
      builder.orderBy(`${this.alias}.${dto.sort_by}`, dto.order || "DESC");
    } else {
      builder.orderBy(
        `${this.alias}.${options?.query?.defaultSortBy || "createdAt"}`,
        dto.order || "DESC"
      );
    }
    return builder;
  }

  async paginate<Result = Pagination<T>>(
    dto: BaseFindAllDto,
    options?: PaginationOptions<T>
  ) {
    let builder = this.createQueryBuilder(this.alias);
    // Apply select, join, groupBy, and having from options.query
    builder = this.buildPaginateQuery(builder, dto, options);
    // Where
    builder = await this.applyWhereConditions(builder, dto, options);
    // Order
    builder = this.applyOrderBy(builder, dto, options);
    // Paginate
    return options?.raw
      ? (utils.paginateRaw(builder, dto) as Promise<Result>)
      : (utils.paginate(builder, dto) as Promise<Result>);
  }

  async paginateWithPrebuiltQuery<Result = T[]>(
    queryName: string,
    dto: BaseFindAllDto,
    options?: PaginationOptions<T>
  ) {
    const prebuiltQuery = this.getPrebuiltQuery(queryName);
    if (!prebuiltQuery) {
      throw new BadRequestException(`Prebuilt query '${queryName}' not found`);
    }

    let builder = prebuiltQuery.build();
    // Apply select, join, groupBy, and having from options.query
    builder = this.buildPaginateQuery(builder, dto, options);
    // Where
    builder = await this.applyWhereConditions(builder, dto, options);
    // Order
    builder = this.applyOrderBy(builder, dto, options);
    // Paginate
    return options?.raw
      ? (utils.paginateRaw(builder, dto) as Promise<Result>)
      : (utils.paginate(builder, dto) as Promise<Result>);
  }

  async createOne(entity: Partial<T>): Promise<T> {
    try {
      const instance = this.repository.create(entity as T);
      return await this.repository.save(instance);
    } catch (error) {
      if (error.code === "23505") {
        throw new ConflictException(`${this.entityName} already exists.`);
      }
      throw error;
    }
  }

  async findOneOrThrow(
    where: FindOptionsWhere<T>,
    relations?: FindOptionsRelations<T>
  ): Promise<T> {
    const entity = await this.repository.findOne({ where, relations });

    if (!entity) {
      this.logger.warn(
        `${this.entityName} not found with where ${JSON.stringify(where)}`
      );
      throw new NotFoundException(`${this.entityName} not found.`);
    }

    return entity;
  }

  async findOneAndUpdate(
    where: FindOptionsWhere<T>,
    partialEntity: QueryDeepPartialEntity<T>
  ) {
    const updateResult = await this.repository.update(where, partialEntity);

    if (!updateResult.affected) {
      this.logger.warn(
        `${this.entityName} not found with where ${JSON.stringify(where)}`
      );
      throw new NotFoundException(`${this.entityName} not found.`);
    }

    return this.findOne({
      where
    });
  }

  async findOneAndDelete(where: FindOptionsWhere<T>) {
    const deleteResult = await this.repository.delete(where);

    if (!deleteResult.affected) {
      this.logger.warn(
        `${this.entityName} not found with where ${JSON.stringify(where)}`
      );
      throw new NotFoundException(`${this.entityName} not found.`);
    }

    return deleteResult.affected > 0;
  }
}
