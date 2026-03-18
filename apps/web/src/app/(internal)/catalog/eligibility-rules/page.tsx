'use client'

import { useState } from 'react'

import type { EligibilityRule } from '@sturec/shared'
import { PageHeader } from '@/components/layout/page-header'
import { FilterBar } from '@/components/shared/filter-bar'
import { Table, type Column } from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CatalogNav } from '../_components/catalog-nav'
import { useEligibilityRules } from '@/features/catalog/hooks/use-catalog'

export default function EligibilityRulesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useEligibilityRules({
    page, limit: 20, search,
  })

  const columns: Column<EligibilityRule>[] = [
    {
      key: 'ruleName',
      header: 'Rule',
      render: (row) => (
        <div>
          <p className="font-medium text-text-primary">{row.ruleName}</p>
          {row.description && (
            <p className="text-xs text-text-muted line-clamp-1">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'field',
      header: 'Field',
      render: (row) => (
        <span className="text-xs font-mono text-text-secondary">{row.field}</span>
      ),
    },
    {
      key: 'operator',
      header: 'Operator',
      className: 'w-24',
      render: (row) => (
        <Badge variant="muted">{row.operator}</Badge>
      ),
    },
    {
      key: 'value',
      header: 'Value',
      render: (row) => (
        <span className="text-sm font-mono text-text-primary">{row.value}</span>
      ),
    },
    {
      key: 'valueType',
      header: 'Type',
      className: 'w-20',
      render: (row) => (
        <span className="text-xs text-text-muted capitalize">{row.valueType}</span>
      ),
    },
    {
      key: 'ruleScope',
      header: 'Scope',
      render: (row) => row.ruleScope ? (
        <span className="text-xs text-text-secondary capitalize">
          {row.ruleScope.replace(/_/g, ' ')}
        </span>
      ) : (
        <span className="text-xs text-text-muted">Global</span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Catalog"
        description="Manage universities, programs, intakes, visa requirements, and eligibility rules."
        badge={data ? <Badge variant="muted">{data.total} rules</Badge> : null}
      />
      <CatalogNav />

      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        searchPlaceholder="Search eligibility rules..."
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : !data?.items.length ? (
        <EmptyState
          title="No eligibility rules found"
          description={search ? 'Try adjusting your search.' : 'Define admission eligibility criteria for programs.'}
          icon={
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M24 6L8 14v12c0 10.667 6.667 18.667 16 22 9.333-3.333 16-11.333 16-22V14L24 6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="M18 24l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
