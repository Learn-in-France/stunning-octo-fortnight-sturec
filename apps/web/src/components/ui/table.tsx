import type { ReactNode } from 'react'

interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  sortable?: boolean
  className?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSort?: (key: string) => void
  onRowClick?: (row: T) => void
  rowKey: (row: T) => string
}

export function Table<T>({
  columns,
  data,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
  rowKey,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`
                  text-left px-4 py-3 text-[11px] font-semibold text-text-muted
                  uppercase tracking-wider whitespace-nowrap
                  ${col.sortable ? 'cursor-pointer select-none hover:text-text-secondary' : ''}
                  ${col.className ?? ''}
                `}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortBy === col.key && (
                    <span className="text-primary-600">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {data.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              className={`
                group transition-colors
                ${onRowClick ? 'cursor-pointer hover:bg-primary-50/40' : ''}
              `}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 whitespace-nowrap ${col.className ?? ''}`}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export type { Column }
