export interface PaginationResultInterface<T> {
  data: T[];
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}
