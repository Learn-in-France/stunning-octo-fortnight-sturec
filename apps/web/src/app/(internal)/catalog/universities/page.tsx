'use client'

import { useState } from 'react'

import type { UniversityItem } from '@sturec/shared'
import { PageHeader } from '@/components/layout/page-header'
import { FilterBar } from '@/components/shared/filter-bar'
import { Table, type Column } from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CatalogNav } from '../_components/catalog-nav'
import { useUniversities } from '@/features/catalog/hooks/use-catalog'

export default function UniversitiesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const { data, isLoading } = useUniversities({
    page, limit: 20, search, sortBy, sortOrder,
  })

  function handleSort(key: string) {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('asc')
    }
  }

  const columns: Column<UniversityItem>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-text-primary">{row.name}</p>
          {row.websiteUrl && (
            <p className="text-xs text-text-muted truncate max-w-[200px]">{row.websiteUrl}</p>
          )}
        </div>
      ),
    },
    {
      key: 'city',
      header: 'City',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-text-secondary">{row.city}</span>
      ),
    },
    {
      key: 'country',
      header: 'Country',
      render: (row) => (
        <span className="text-sm text-text-secondary">{row.country}</span>
      ),
    },
    {
      key: 'partnerStatus',
      header: 'Partner',
      render: (row) => row.partnerStatus ? (
        <Badge variant="info">{row.partnerStatus}</Badge>
      ) : (
        <span className="text-xs text-text-muted">—</span>
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
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-text-muted font-mono">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Catalog"
        description="Manage universities, programs, intakes, visa requirements, and eligibility rules."
        badge={data ? <Badge variant="muted">{data.total} universities</Badge> : null}
      />
      <CatalogNav />

      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        searchPlaceholder="Search universities by name or city..."
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : !data?.items.length ? (
        <EmptyState
          title="No universities found"
          description={search ? 'Try adjusting your search.' : 'Add your first university to get started.'}
          icon={
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M24 6L6 16v4h36v-4L24 6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="M10 20v16M18 20v16M30 20v16M38 20v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <rect x="6" y="36" width="36" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
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
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
