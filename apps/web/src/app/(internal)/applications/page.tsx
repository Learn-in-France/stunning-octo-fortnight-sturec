'use client'

import { useState } from 'react'

import type { ApplicationListItem, ApplicationStatus } from '@sturec/shared'
import { PageHeader } from '@/components/layout/page-header'
import { Table, type Column } from '@/components/ui/table'
import { Select } from '@/components/ui/select'
import { Pagination } from '@/components/ui/pagination'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuth } from '@/providers/auth-provider'
import { useApplications, useApplicationStats } from '@/features/applications/hooks/use-applications'

const STATUS_VARIANTS: Record<string, 'muted' | 'info' | 'warning' | 'success' | 'danger'> = {
  draft: 'muted',
  submitted: 'info',
  offer: 'success',
  rejected: 'danger',
  enrolled: 'success',
}

export default function ApplicationsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [status, setStatus] = useState<ApplicationStatus | ''>('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { data, isLoading } = useApplications({
    page, limit: 20, status, sortBy, sortOrder,
  }, { enabled: isAdmin })
  const { data: stats } = useApplicationStats({ enabled: isAdmin })

  if (!isAdmin) {
    return (
      <div>
        <PageHeader
          title="Applications"
          description="Application oversight is available to admins only."
        />
        <div className="rounded-2xl bg-white/50 border border-white/70 backdrop-blur-sm">
          <EmptyState
            title="Admin access required"
            description="Counsellors should manage applications from each student record instead of the global applications queue."
            icon={
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="8" y="22" width="32" height="18" rx="4" stroke="currentColor" strokeWidth="2" />
                <path d="M16 22v-4a8 8 0 1116 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            }
          />
        </div>
      </div>
    )
  }

  const hasFilters = !!status

  function handleSort(key: string) {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('desc')
    }
  }

  const columns: Column<ApplicationListItem>[] = [
    {
      key: 'program',
      header: 'Program',
      render: (row) => (
        <div>
          <p className="font-medium text-text-primary">{row.programName}</p>
          <p className="text-xs text-text-muted">{row.universityName}</p>
        </div>
      ),
    },
    {
      key: 'intake',
      header: 'Intake',
      render: (row) => row.intakeName ? (
        <span className="text-sm text-text-secondary">{row.intakeName}</span>
      ) : (
        <span className="text-xs text-text-muted">—</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={STATUS_VARIANTS[row.status] ?? 'muted'} dot>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      sortable: true,
      render: (row) => row.submittedAt ? (
        <span className="text-xs text-text-secondary font-mono">{formatDate(row.submittedAt)}</span>
      ) : (
        <span className="text-xs text-text-muted">—</span>
      ),
    },
    {
      key: 'decisionAt',
      header: 'Decision',
      render: (row) => row.decisionAt ? (
        <span className="text-xs text-text-secondary font-mono">{formatDate(row.decisionAt)}</span>
      ) : (
        <span className="text-xs text-text-muted">Pending</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-text-muted font-mono">{formatDate(row.createdAt)}</span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Applications"
        description="Track student applications across programs and universities."
        badge={data ? <Badge variant="muted">{data.total} total</Badge> : null}
      />

      {/* Summary metrics */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
          <MetricCard label="Total" value={stats.total} />
          <MetricCard label="Submitted" value={stats.submitted} accent="bg-sky-500" />
          <MetricCard label="Offers" value={stats.offers} accent="bg-primary-500" />
          <MetricCard label="Enrolled" value={stats.enrolled} accent="bg-primary-500" />
        </div>
      )}

      {/* Filter panel */}
      <div className="rounded-2xl bg-white/50 border border-white/70 px-4 py-3 mb-5 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            options={[
              { value: '', label: 'All statuses' },
              { value: 'draft', label: 'Draft' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'offer', label: 'Offer' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'enrolled', label: 'Enrolled' },
            ]}
            value={status}
            onChange={(e) => { setStatus(e.target.value as ApplicationStatus | ''); setPage(1) }}
            className="w-36"
          />
          {hasFilters && (
            <button
              onClick={() => { setStatus(''); setPage(1) }}
              className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : !data?.items.length ? (
        <div className="rounded-2xl bg-white/50 border border-white/70 backdrop-blur-sm">
          <EmptyState
            title="No applications found"
            description={hasFilters
              ? 'No applications match this status filter. Try selecting a different status.'
              : 'Applications will appear here as counsellors create them for students. Start by converting a lead to a student.'}
            icon={
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="8" y="4" width="32" height="40" rx="4" stroke="currentColor" strokeWidth="2" />
                <path d="M16 16h16M16 24h16M16 32h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            }
          />
        </div>
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

function MetricCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-2xl bg-white/60 border border-white/80 px-4 py-3.5 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-1">
        {accent && <span className={`h-2 w-2 rounded-full ${accent}`} />}
        <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl font-bold font-display text-text-primary tracking-tight">{value}</p>
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
