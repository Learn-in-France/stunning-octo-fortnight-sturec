'use client'

import { useState } from 'react'

import type { VisaRequirement } from '@sturec/shared'
import { PageHeader } from '@/components/layout/page-header'
import { FilterBar } from '@/components/shared/filter-bar'
import { Table, type Column } from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CatalogNav } from '../_components/catalog-nav'
import { useVisaRequirements } from '@/features/catalog/hooks/use-catalog'

export default function VisaRequirementsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useVisaRequirements({
    page, limit: 20, search, sortBy: 'sortOrder', sortOrder: 'asc',
  })

  const columns: Column<VisaRequirement>[] = [
    {
      key: 'title',
      header: 'Requirement',
      render: (row) => (
        <div>
          <p className="font-medium text-text-primary">{row.title}</p>
          <p className="text-xs text-text-muted line-clamp-1">{row.description}</p>
        </div>
      ),
    },
    {
      key: 'documentType',
      header: 'Document Type',
      render: (row) => (
        <span className="text-sm text-text-secondary capitalize">
          {row.documentType.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'required',
      header: 'Required',
      render: (row) => (
        <Badge variant={row.required ? 'danger' : 'muted'}>
          {row.required ? 'Required' : 'Optional'}
        </Badge>
      ),
    },
    {
      key: 'countrySpecific',
      header: 'Country',
      render: (row) => row.countrySpecific ? (
        <span className="text-sm text-text-secondary">{row.countrySpecific}</span>
      ) : (
        <span className="text-xs text-text-muted">All</span>
      ),
    },
    {
      key: 'stageApplicable',
      header: 'Stage',
      render: (row) => row.stageApplicable ? (
        <span className="text-xs text-text-secondary capitalize">
          {row.stageApplicable.replace(/_/g, ' ')}
        </span>
      ) : (
        <span className="text-xs text-text-muted">—</span>
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
  ]

  return (
    <div>
      <PageHeader
        title="Catalog"
        description="Manage universities, programs, intakes, visa requirements, and eligibility rules."
        badge={data ? <Badge variant="muted">{data.total} requirements</Badge> : null}
      />
      <CatalogNav />

      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        searchPlaceholder="Search visa requirements..."
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : !data?.items.length ? (
        <EmptyState
          title="No visa requirements found"
          description={search ? 'Try adjusting your search.' : 'Add visa documentation requirements for the AI advisor to reference.'}
          icon={
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="8" y="6" width="32" height="36" rx="3" stroke="currentColor" strokeWidth="2" />
              <circle cx="24" cy="20" r="6" stroke="currentColor" strokeWidth="2" />
              <path d="M14 34h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M18 38h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
