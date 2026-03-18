'use client'

import type { ReactNode } from 'react'
import { SearchInput } from '@/components/ui/search-input'

interface FilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  children?: ReactNode
  actions?: ReactNode
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  children,
  actions,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        className="w-64"
      />
      {children && (
        <div className="flex items-center gap-2 flex-wrap">
          {children}
        </div>
      )}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  )
}
