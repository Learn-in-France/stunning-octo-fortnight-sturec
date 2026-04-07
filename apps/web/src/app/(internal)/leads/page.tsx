'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import type { LeadStatus, LeadSource, PriorityLevel } from '@sturec/shared'
import { PageHeader } from '@/components/layout/page-header'
import { PriorityBadge } from '@/components/shared/priority-badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { Table, type Column } from '@/components/ui/table'
import { Select } from '@/components/ui/select'
import { Pagination } from '@/components/ui/pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SearchInput } from '@/components/ui/search-input'
import { useLeads, useLeadStats, type LeadListItemView } from '@/features/leads/hooks/use-leads'

export default function LeadsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<LeadStatus | ''>('')
  const [source, setSource] = useState<LeadSource | ''>('')
  const [priority, setPriority] = useState<PriorityLevel | ''>('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('priorityLevel')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const { data, isLoading } = useLeads({
    page, limit: 20, search, status, source, priority, sortBy, sortOrder,
  })
  const { data: stats } = useLeadStats()

  const hasFilters = !!(search || status || source || priority)

  function clearFilters() {
    setSearch('')
    setStatus('')
    setSource('')
    setPriority('')
    setPage(1)
  }

  function handleSort(key: string) {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('asc')
    }
  }

  const columns: Column<LeadListItemView>[] = [
    {
      key: 'priorityLevel',
      header: 'Priority',
      sortable: true,
      className: 'w-20',
      render: (row) => <PriorityBadge priority={row.priorityLevel} />,
    },
    {
      key: 'qualificationScore',
      header: 'Score',
      sortable: true,
      className: 'w-16',
      render: (row) => <QualScore value={row.qualificationScore} />,
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-text-primary">
            {row.firstName} {row.lastName}
          </p>
          <p className="text-xs text-text-muted">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      render: (row) => (
        <div className="space-y-1">
          <p className="text-xs text-text-secondary capitalize">{row.source}</p>
          {row.sourcePartner && (
            <p className="text-[11px] text-text-muted">{row.sourcePartner}</p>
          )}
          <div className="flex flex-wrap gap-1">
            {row.isPartnerHotLead && (
              <Badge variant="warning">Hot partner lead</Badge>
            )}
            {row.needsIntakeCompletion && (
              <Badge variant="muted">Needs intake</Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'profileCompleteness',
      header: 'Profile',
      className: 'w-24',
      render: (row) => <ProfileBar value={row.profileCompleteness} />,
    },
    {
      key: 'counsellor',
      header: 'Counsellor',
      render: (row) => (
        <span className={`text-xs ${row.assignedCounsellorId ? 'text-text-secondary' : 'text-text-muted italic'}`}>
          {row.counsellorName}
        </span>
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
        title="Leads"
        description="Manage incoming leads and qualification pipeline."
        badge={data ? <Badge variant="muted">{data.total} total</Badge> : null}
        actions={
          <Button size="sm" icon={
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          }>
            Import CSV
          </Button>
        }
      />

      {/* Summary metrics */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-3 lg:grid-cols-5">
          <MetricCard label="Total leads" value={stats.total} />
          <MetricCard label="New" value={stats.new} accent="bg-status-new" />
          <MetricCard label="Qualified" value={stats.qualified} accent="bg-status-qualified" />
          <MetricCard label="Converted" value={stats.converted} accent="bg-status-converted" />
          <MetricCard label="Disqualified" value={stats.disqualified} accent="bg-status-disqualified" />
        </div>
      )}

      {/* Filter panel */}
      <div className="rounded-2xl bg-white/50 border border-white/70 px-4 py-3 mb-5 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1) }}
            placeholder="Search leads by name or email..."
            className="w-64"
          />
          <div className="h-5 w-px bg-border/60 hidden sm:block" />
          <Select
            options={[
              { value: '', label: 'All statuses' },
              { value: 'new', label: 'New' },
              { value: 'nurturing', label: 'Nurturing' },
              { value: 'qualified', label: 'Qualified' },
              { value: 'disqualified', label: 'Disqualified' },
              { value: 'converted', label: 'Converted' },
            ]}
            value={status}
            onChange={(e) => { setStatus(e.target.value as LeadStatus | ''); setPage(1) }}
            className="w-36"
          />
          <Select
            options={[
              { value: '', label: 'All sources' },
              { value: 'marketing', label: 'Marketing' },
              { value: 'university', label: 'University' },
              { value: 'referral', label: 'Referral' },
              { value: 'whatsapp', label: 'WhatsApp' },
              { value: 'ads', label: 'Ads' },
              { value: 'manual', label: 'Manual' },
            ]}
            value={source}
            onChange={(e) => { setSource(e.target.value as LeadSource | ''); setPage(1) }}
            className="w-36"
          />
          <Select
            options={[
              { value: '', label: 'All priorities' },
              { value: 'p1', label: 'P1 — High' },
              { value: 'p2', label: 'P2 — Medium' },
              { value: 'p3', label: 'P3 — Low' },
            ]}
            value={priority}
            onChange={(e) => { setPriority(e.target.value as PriorityLevel | ''); setPage(1) }}
            className="w-36"
          />
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
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
            title="No leads found"
            description={hasFilters
              ? 'No leads match your current filters. Try broadening your search.'
              : 'Leads will appear here as they come in from your marketing channels, referrals, and manual imports.'}
            icon={
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="6" y="6" width="36" height="36" rx="8" stroke="currentColor" strokeWidth="2" />
                <path d="M18 24h12M24 18v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
              onRowClick={(row) => router.push(`/leads/${row.id}`)}
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

function QualScore({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-xs text-text-muted font-mono">—</span>
  }

  const color =
    value >= 80 ? 'text-score-high bg-score-high/10' :
    value >= 60 ? 'text-score-mid bg-score-mid/10' :
    'text-score-low bg-score-low/10'

  return (
    <span className={`inline-flex items-center justify-center w-9 h-6 rounded text-xs font-mono font-bold ${color}`}>
      {value}
    </span>
  )
}

function ProfileBar({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-text-muted">—</span>

  const pct = Math.round(value * 100)
  const color =
    pct >= 70 ? 'bg-score-high' :
    pct >= 40 ? 'bg-score-mid' :
    'bg-score-low'

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-surface-sunken overflow-hidden">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-text-muted">{pct}%</span>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
