'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import type { StudentStage, VisaRisk } from '@sturec/shared'
import { STAGE_DISPLAY_NAMES } from '@sturec/shared'
import { PageHeader } from '@/components/layout/page-header'
import { FilterBar } from '@/components/shared/filter-bar'
import { StageBadge } from '@/components/shared/stage-badge'
import { Table, type Column } from '@/components/ui/table'
import { Select } from '@/components/ui/select'
import { Pagination } from '@/components/ui/pagination'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useStudents, type StudentListItemView } from '@/features/students/hooks/use-students'

export default function StudentsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState<StudentStage | ''>('')
  const [visaRisk, setVisaRisk] = useState<VisaRisk | ''>('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('stageUpdatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { data, isLoading } = useStudents({
    page, limit: 20, search, stage, visaRisk, sortBy, sortOrder,
  })

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
        description="Track enrolled students through the 13-stage lifecycle."
        badge={data ? <Badge variant="muted">{data.total} total</Badge> : null}
      />

      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        searchPlaceholder="Search by name or reference..."
      >
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
      </FilterBar>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : !data?.items.length ? (
        <EmptyState
          title="No students found"
          description={search || stage || visaRisk
            ? 'Try adjusting your filters.'
            : 'Students will appear here when leads are converted.'}
          icon={
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="16" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="currentColor" strokeWidth="2" />
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
