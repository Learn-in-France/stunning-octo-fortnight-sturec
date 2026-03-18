import type { PaginationInput, PaginatedResponse } from '@sturec/shared'

/**
 * Convert parsed pagination input into Prisma query args.
 */
export function toPrismaArgs(input: PaginationInput) {
  return {
    skip: (input.page - 1) * input.limit,
    take: input.limit,
    orderBy: { [input.sortBy]: input.sortOrder } as Record<string, 'asc' | 'desc'>,
  }
}

/**
 * Build a paginated response from items and total count.
 */
export function paginate<T>(
  items: T[],
  total: number,
  input: PaginationInput,
): PaginatedResponse<T> {
  return {
    items,
    page: input.page,
    limit: input.limit,
    total,
  }
}
