export interface PaginatedResult<T> {
  items: T[]
  page: number
  limit: number
  total: number
}

export function paginate<T>(items: T[], total: number, page: number, limit: number): PaginatedResult<T> {
  return { items, page, limit, total }
}
