'use client'

import { useState } from 'react'

import type { CampusFrancePrep } from '@sturec/shared'
import { PageHeader } from '@/components/layout/page-header'
import { FilterBar } from '@/components/shared/filter-bar'
import { Table, type Column } from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CatalogNav } from '../_components/catalog-nav'
import { useCampusFrancePreps } from '@/features/catalog/hooks/use-catalog'

export default function CampusFrancePrepPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useCampusFrancePreps({
    page, limit: 20, search, sortBy: 'sortOrder', sortOrder: 'asc',
  })

  const columns: Column<CampusFrancePrep>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (row) => (
        <p className="font-medium text-text-primary">{row.title}</p>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => (
        <Badge variant="info">{row.category}</Badge>
      ),
    },
    {
      key: 'content',
      header: 'Preview',
      render: (row) => (
        <p className="text-xs text-text-muted line-clamp-2 max-w-[300px]">{row.content}</p>
      ),
    },
    {
      key: 'sortOrder',
      header: 'Order',
      className: 'w-16',
      render: (row) => (
        <span className="text-xs font-mono text-text-muted">{row.sortOrder}</span>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.active ? 'success' : 'muted'} dot>
          {row.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Catalog"
        description="Manage universities, programs, intakes, visa requirements, and eligibility rules."
        badge={data ? <Badge variant="muted">{data.total} items</Badge> : null}
      />
      <CatalogNav />

      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        searchPlaceholder="Search prep materials..."
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : !data?.items.length ? (
        <EmptyState
          title="No prep materials found"
          description={search ? 'Try adjusting your search.' : 'Add Campus France preparation content and checklists.'}
          icon={
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="6" y="6" width="36" height="36" rx="4" stroke="currentColor" strokeWidth="2" />
              <path d="M16 18l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M24 30h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          }
        />
      ) : (
        <>
          <div className="bg-surface-raised rounded-xl border border-border overflow-hidden">
            <Table
              columns={columns}
              data={data.items}
              rowKey={(row) => row.id}
            />
          </div>
          <Pagination
            page={data.page}
            limit={data.limit}
            total={data.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
