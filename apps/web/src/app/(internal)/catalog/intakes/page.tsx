'use client'

import { useState } from 'react'

import type { ProgramIntakeItem } from '@sturec/shared'
import { PageHeader } from '@/components/layout/page-header'
import { Select } from '@/components/ui/select'
import { Table, type Column } from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CatalogNav } from '../_components/catalog-nav'
import { usePrograms, useIntakes } from '@/features/catalog/hooks/use-catalog'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function IntakesPage() {
  const [programId, setProgramId] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('startYear')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { data: programsData } = usePrograms({ limit: 100, sortBy: 'name', sortOrder: 'asc' })
  const { data, isLoading } = useIntakes({
    programId, page, limit: 20, sortBy, sortOrder,
  })

  function handleSort(key: string) {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('desc')
    }
  }

  const programOptions = [
    { value: '', label: 'Select a program...' },
    ...(programsData?.items.map((p) => ({
      value: p.id,
      label: `${p.name} — ${p.universityName}`,
    })) ?? []),
  ]

  const columns: Column<ProgramIntakeItem>[] = [
    {
      key: 'intakeName',
      header: 'Intake',
      sortable: true,
      render: (row) => (
        <p className="font-medium text-text-primary">{row.intakeName}</p>
      ),
    },
    {
      key: 'startYear',
      header: 'Start',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-text-secondary">
          {MONTH_NAMES[row.startMonth - 1]} {row.startYear}
        </span>
      ),
    },
    {
      key: 'applicationDeadline',
      header: 'Deadline',
      render: (row) => row.applicationDeadline ? (
        <span className="text-xs text-text-secondary font-mono">
          {formatDate(row.applicationDeadline)}
        </span>
      ) : (
        <span className="text-xs text-text-muted">—</span>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.active ? 'success' : 'muted'} dot>
          {row.active ? 'Open' : 'Closed'}
        </Badge>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Catalog"
        description="Manage universities, programs, intakes, visa requirements, and eligibility rules."
        badge={data ? <Badge variant="muted">{data.total} intakes</Badge> : null}
      />
      <CatalogNav />

      <div className="mb-4">
        <label className="block text-xs font-medium text-text-muted mb-1.5">Program</label>
        <Select
          options={programOptions}
          value={programId}
          onChange={(e) => { setProgramId(e.target.value); setPage(1) }}
          className="w-full max-w-md"
        />
      </div>

      {!programId ? (
        <EmptyState
          title="Select a program"
          description="Choose a program above to view and manage its intakes."
          icon={
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="6" y="10" width="36" height="30" rx="3" stroke="currentColor" strokeWidth="2" />
              <path d="M6 18h36" stroke="currentColor" strokeWidth="2" />
              <path d="M14 6v8M34 6v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="18" cy="28" r="2" fill="currentColor" opacity="0.3" />
              <circle cx="24" cy="28" r="2" fill="currentColor" opacity="0.3" />
              <circle cx="30" cy="28" r="2" fill="currentColor" opacity="0.3" />
            </svg>
          }
        />
      ) : isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : !data?.items.length ? (
        <EmptyState
          title="No intakes found"
          description="This program has no intakes yet. Create one to start tracking application windows."
          icon={
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="6" y="10" width="36" height="30" rx="3" stroke="currentColor" strokeWidth="2" />
              <path d="M6 18h36" stroke="currentColor" strokeWidth="2" />
              <path d="M14 6v8M34 6v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
