import { PaginationResultInterface } from "src/shared/paginate/pagination.results.interface";

type TPagination = Omit<PaginationResultInterface<any>, "data">;

export class Pagination<T> {
  data: T[] = [];
  pagination: TPagination = {
    page: 1,
    limit: 10,
    total_items: 0,
    total_pages: 0
  };

  constructor(paginationResults: PaginationResultInterface<T>) {
    this.data = paginationResults.data || [];
    this.pagination.page = paginationResults.page || 1;
    this.pagination.limit = paginationResults.limit || 10;
    this.pagination.total_items = paginationResults.total_items || 0;
    this.pagination.total_pages = paginationResults.total_pages || 0;
  }
}
