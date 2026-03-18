'use client'

interface PaginationProps {
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, limit, total, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) return null

  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <div className="flex items-center justify-between py-3">
      <p className="text-xs text-text-muted">
        <span className="font-mono">{start}</span>–
        <span className="font-mono">{end}</span> of{' '}
        <span className="font-mono">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-2.5 py-1.5 text-xs rounded-md border border-border bg-surface-raised
            text-text-secondary hover:bg-surface-sunken disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors"
        >
          Prev
        </button>
        {generatePageNumbers(page, totalPages).map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-1 text-text-muted text-xs">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`
                w-8 h-8 text-xs rounded-md transition-colors font-mono
                ${
                  p === page
                    ? 'bg-primary-600 text-white font-semibold'
                    : 'border border-border bg-surface-raised text-text-secondary hover:bg-surface-sunken'
                }
              `}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-2.5 py-1.5 text-xs rounded-md border border-border bg-surface-raised
            text-text-secondary hover:bg-surface-sunken disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}

function generatePageNumbers(
  current: number,
  total: number,
): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '...')[] = [1]
  if (current > 3) pages.push('...')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('...')
  pages.push(total)

  return pages
}
