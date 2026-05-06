import { ObjectLiteral, SelectQueryBuilder } from "typeorm";
import { BaseFindAllDto } from "../paginate/base-find-all.dto";

type BuilderFunction<T extends ObjectLiteral> = (
  builder: SelectQueryBuilder<T>,
  alias: string
) => SelectQueryBuilder<T>;

type BuilderFunctionWithDto<T extends ObjectLiteral> = (
  builder: SelectQueryBuilder<T>,
  dto: BaseFindAllDto,
  alias: string
) => SelectQueryBuilder<T>;

type AsyncBuilderFunctionWithDto<T extends ObjectLiteral> = (
  builder: SelectQueryBuilder<T>,
  dto: BaseFindAllDto,
  alias: string
) => Promise<SelectQueryBuilder<T>>;

export interface QueryConfiguration<T extends ObjectLiteral> {
  select?: BuilderFunction<T>;
  /**
   * dibuat async supaya bisa pake await di dalamnya
   * misalnya untuk query yang butuh data dari table lain
   * jadi caranya itu bisa pakai await atau subquery
   * contoh dengan await: where id in ( 1, 2, 3 )
   * contoh dengan subquery: where id in ( select id from table where condition )
   */
  where?: AsyncBuilderFunctionWithDto<T>;
  orderBy?: BuilderFunctionWithDto<T>;
  join?: BuilderFunction<T>; // kalau misalnya join nya complex ON-nya pake ini
  allowedSortBy?: string[];
  groupBy?: BuilderFunction<T>;
  having?: BuilderFunction<T>;
  defaultSortBy?: string; // default nya createdAt
}

export interface PaginationOptions<T extends ObjectLiteral> {
  relations?: string[]; // kalau misalnya join nya simple ON-nya pake ini aja
  searchCriteria?: string[];
  query?: QueryConfiguration<T>;
  raw?: boolean;
}
