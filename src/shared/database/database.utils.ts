import { ObjectLiteral, Repository, SelectQueryBuilder } from "typeorm";
import { BaseFindAllDto } from "../paginate/base-find-all.dto";
import { Pagination } from "../paginate";

export function isColumnSelected<T extends ObjectLiteral>(
  builder: SelectQueryBuilder<T>,
  alias: string,
  column: string
): boolean {
  return builder.expressionMap.selects.some((select) => {
    return (
      select.selection === `${alias}.${column}` || select.selection === alias
    );
  });
}

export async function paginate<T extends ObjectLiteral>(
  builder: SelectQueryBuilder<T>,
  dto: BaseFindAllDto
) {
  const limitIsNegativeOne = dto.limit === -1;

  if (!limitIsNegativeOne) {
    const offset = (dto.page - 1) * dto.limit;
    builder.limit(dto.limit).offset(offset);
  }

  const [result, total] = await builder.getManyAndCount();

  return new Pagination({
    data: result,
    page: dto.page,
    limit: dto.limit,
    total_items: total,
    total_pages: limitIsNegativeOne ? 1 : Math.ceil(total / dto.limit)
  });
}

export async function paginateRaw<T extends ObjectLiteral>(
  builder: SelectQueryBuilder<T>,
  dto: BaseFindAllDto
) {
  const limitIsNegativeOne = dto.limit === -1;

  if (!limitIsNegativeOne) {
    const offset = (dto.page - 1) * dto.limit;
    builder.limit(dto.limit).offset(offset);
  }

  const result = await builder.getRawMany();
  const total = await builder.getCount();

  return new Pagination({
    data: result,
    page: dto.page,
    limit: dto.limit,
    total_items: total,
    total_pages: limitIsNegativeOne ? 1 : Math.ceil(total / dto.limit)
  });
}

export interface BaseQueryBuilder<T extends ObjectLiteral> {
  alias: string;
  builder: SelectQueryBuilder<T>;
  build(): SelectQueryBuilder<T>;
}

export class PrebuiltQueryBuilder<T extends ObjectLiteral>
  implements BaseQueryBuilder<T>
{
  public alias: string;
  public builder: SelectQueryBuilder<T>;

  constructor(
    readonly repository: Repository<T>,
    readonly baseAlias: string,
    readonly builderFunction: (
      builder: SelectQueryBuilder<T>,
      alias: string
    ) => SelectQueryBuilder<T>
  ) {
    this.alias = baseAlias;
    this.builder = repository.createQueryBuilder(baseAlias);
    this.builder = builderFunction(this.builder, baseAlias);
  }

  build(): SelectQueryBuilder<T> {
    return this.builder;
  }

  addWhere(condition: string, parameters?: Record<string, any>): this {
    this.builder.andWhere(condition, parameters);
    return this;
  }

  addOrderBy(sort: string, order: "ASC" | "DESC" = "ASC"): this {
    this.builder.addOrderBy(sort, order);
    return this;
  }

  addLimit(limit: number, offset?: number): this {
    this.builder.limit(limit);
    if (offset) this.builder.offset(offset);
    return this;
  }
}
