'use client'

import { useState } from 'react'

import type { ProgramItem } from '@sturec/shared'
import { PageHeader } from '@/components/layout/page-header'
import { FilterBar } from '@/components/shared/filter-bar'
import { Table, type Column } from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CatalogNav } from '../_components/catalog-nav'
import { usePrograms } from '@/features/catalog/hooks/use-catalog'

export default function ProgramsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const { data, isLoading } = usePrograms({
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

  const columns: Column<ProgramItem>[] = [
    {
      key: 'name',
      header: 'Program',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-text-primary">{row.name}</p>
          <p className="text-xs text-text-muted">{row.universityName}</p>
        </div>
      ),
    },
    {
      key: 'degreeLevel',
      header: 'Degree',
      render: (row) => (
        <span className="text-sm text-text-secondary capitalize">{row.degreeLevel}</span>
      ),
    },
    {
      key: 'fieldOfStudy',
      header: 'Field',
      render: (row) => (
        <span className="text-sm text-text-secondary">{row.fieldOfStudy}</span>
      ),
    },
    {
      key: 'language',
      header: 'Language',
      render: (row) => (
        <Badge variant="info">{row.language}</Badge>
      ),
    },
    {
      key: 'tuitionAmount',
      header: 'Tuition',
      sortable: true,
      render: (row) => (
        <span className="text-sm font-mono text-text-primary">
          {new Intl.NumberFormat('en-GB', { style: 'currency', currency: row.tuitionCurrency, maximumFractionDigits: 0 }).format(row.tuitionAmount)}
        </span>
      ),
    },
    {
      key: 'durationMonths',
      header: 'Duration',
      render: (row) => (
        <span className="text-xs text-text-secondary">
          {row.durationMonths} mo
        </span>
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
        badge={data ? <Badge variant="muted">{data.total} programs</Badge> : null}
      />
      <CatalogNav />

      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        searchPlaceholder="Search programs by name, field, or university..."
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : !data?.items.length ? (
        <EmptyState
          title="No programs found"
          description={search ? 'Try adjusting your search.' : 'Add your first program to get started.'}
          icon={
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="6" y="8" width="36" height="32" rx="3" stroke="currentColor" strokeWidth="2" />
              <path d="M14 18h20M14 24h20M14 30h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
