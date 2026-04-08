'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import type { StudentStage, VisaRisk } from '@sturec/shared'
import { STAGE_DISPLAY_NAMES } from '@sturec/shared'
import { PageHeader } from '@/components/layout/page-header'
import { StageBadge } from '@/components/shared/stage-badge'
import { Table, type Column } from '@/components/ui/table'
import { Select } from '@/components/ui/select'
import { Pagination } from '@/components/ui/pagination'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SearchInput } from '@/components/ui/search-input'
import { useAuth } from '@/providers/auth-provider'
import { useStudents, useStudentStats, type StudentListItemView } from '@/features/students/hooks/use-students'

export default function StudentsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const isCounsellor = user?.role === 'counsellor'
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState<StudentStage | ''>('')
  const [visaRisk, setVisaRisk] = useState<VisaRisk | ''>('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('stageUpdatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { data, isLoading } = useStudents({
    page,
    limit: 20,
    search,
    stage,
    visaRisk,
    sortBy,
    sortOrder,
    counsellorId: isCounsellor ? user?.id : undefined,
  }, {
    resolveCounsellorNames: !isCounsellor,
    currentUserId: user?.id,
  })
  const { data: stats } = useStudentStats({ enabled: !isCounsellor })

  const hasFilters = !!(search || stage || visaRisk)

  function clearFilters() {
    setSearch('')
    setStage('')
    setVisaRisk('')
    setPage(1)
  }

  function handleSort(key: string) {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('desc')
    }
  }

  const stageOptions = Object.entries(STAGE_DISPLAY_NAMES).map(([value, label]) => ({
    value, label,
  }))

  const columns: Column<StudentListItemView>[] = [
    {
      key: 'referenceCode',
      header: 'Ref',
      sortable: true,
      className: 'w-32',
      render: (row) => (
        <span className="text-xs font-mono text-primary-700 font-semibold">{row.referenceCode}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div>
          <p className="font-medium text-text-primary">{row.firstName} {row.lastName}</p>
          <p className="text-xs text-text-muted">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Stage',
      render: (row) => <StageBadge stage={row.stage} />,
    },
    {
      key: 'visaRisk',
      header: 'Visa Risk',
      render: (row) => <VisaRiskBadge risk={row.visaRisk} />,
    },
    {
      key: 'overallReadinessScore',
      header: 'Readiness',
      sortable: true,
      className: 'w-24',
      render: (row) => <ReadinessBar value={row.overallReadinessScore} />,
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
      key: 'stageUpdatedAt',
      header: 'Stage Updated',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-text-muted font-mono">
          {formatDate(row.stageUpdatedAt)}
        </span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Students"
        description={isCounsellor
          ? 'Track your assigned students and move each case forward.'
          : 'Track enrolled students through the 13-stage lifecycle.'}
        badge={data ? <Badge variant="muted">{data.total} total</Badge> : null}
      />

      {/* Summary metrics */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-3 lg:grid-cols-4">
          <MetricCard label="Total students" value={stats.total} />
          <MetricCard label="Active" value={stats.active} accent="bg-primary-500" />
          <MetricCard
            label="Top stage"
            value={topStage(stats.byStage)}
            isText
          />
          <MetricCard
            label="Stages tracked"
            value={Object.keys(stats.byStage).length}
            accent="bg-text-muted"
          />
        </div>
      )}

      {/* Filter panel */}
      <div className="rounded-2xl bg-white/50 border border-white/70 px-4 py-3 mb-5 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1) }}
            placeholder="Search by name or reference..."
            className="w-64"
          />
          <div className="h-5 w-px bg-border/60 hidden sm:block" />
          <Select
            options={[{ value: '', label: 'All stages' }, ...stageOptions]}
            value={stage}
            onChange={(e) => { setStage(e.target.value as StudentStage | ''); setPage(1) }}
            className="w-48"
          />
          <Select
            options={[
              { value: '', label: 'All visa risk' },
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
            value={visaRisk}
            onChange={(e) => { setVisaRisk(e.target.value as VisaRisk | ''); setPage(1) }}
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
            title="No students found"
            description={hasFilters
              ? 'No students match your current filters. Try broadening your search.'
              : isCounsellor
                ? 'No students are currently assigned to you. New assignments will appear here once an admin hands them over.'
                : 'Students will appear here when leads are converted. Go to the Leads page to manage your pipeline.'}
            icon={
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="16" r="8" stroke="currentColor" strokeWidth="2" />
                <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="currentColor" strokeWidth="2" />
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
              onRowClick={(row) => router.push(`/students/${row.id}`)}
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

function MetricCard({ label, value, accent, isText }: { label: string; value: number | string; accent?: string; isText?: boolean }) {
  return (
    <div className="rounded-2xl bg-white/60 border border-white/80 px-4 py-3.5 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-1">
        {accent && <span className={`h-2 w-2 rounded-full ${accent}`} />}
        <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider">{label}</p>
      </div>
      <p className={`font-bold font-display text-text-primary tracking-tight ${isText ? 'text-base' : 'text-2xl'}`}>
        {value}
      </p>
    </div>
  )
}

function topStage(byStage: Record<string, number>): string {
  const entries = Object.entries(byStage)
  if (entries.length === 0) return '—'
  const [stage] = entries.reduce((a, b) => (b[1] > a[1] ? b : a))
  return (STAGE_DISPLAY_NAMES as Record<string, string>)[stage] ?? stage.replace(/_/g, ' ')
}

function VisaRiskBadge({ risk }: { risk: VisaRisk | null }) {
  if (!risk) return <span className="text-xs text-text-muted">—</span>
  const config: Record<string, { variant: 'success' | 'warning' | 'danger'; label: string }> = {
    low: { variant: 'success', label: 'Low' },
    medium: { variant: 'warning', label: 'Medium' },
    high: { variant: 'danger', label: 'High' },
  }
  const c = config[risk]
  return <Badge variant={c.variant} dot>{c.label}</Badge>
}

function ReadinessBar({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-text-muted">—</span>
  const color = value >= 70 ? 'bg-score-high' : value >= 40 ? 'bg-score-mid' : 'bg-score-low'
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 rounded-full bg-surface-sunken overflow-hidden">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] font-mono text-text-muted">{value}</span>
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
