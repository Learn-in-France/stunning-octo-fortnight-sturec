export interface PaginatedResponse<T> {
  items: T[]
  page: number
  limit: number
  total: number
}

export interface ApiError {
  error: string
  code: string
  details?: Record<string, unknown>
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
