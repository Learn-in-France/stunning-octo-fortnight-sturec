'use client'

import { useRouter } from 'next/navigation'

import type { StudentAnalyticsItem } from '@sturec/shared'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Table, type Column } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { STAGE_DISPLAY_NAMES } from '@sturec/shared'
import { useStudentAnalytics } from '@/features/analytics/hooks/use-analytics'

export default function StudentAnalyticsPage() {
  const router = useRouter()
  const { data: students, isLoading } = useStudentAnalytics()

  const columns: Column<StudentAnalyticsItem>[] = [
    {
      key: 'name',
      header: 'Student',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-text-primary">{row.firstName} {row.lastName}</p>
          <p className="text-xs text-text-muted">{row.referenceCode}</p>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Stage',
      render: (row) => (
        <span className="text-xs text-text-secondary">
          {STAGE_DISPLAY_NAMES[row.stage as keyof typeof STAGE_DISPLAY_NAMES] ?? row.stage}
        </span>
      ),
    },
    {
      key: 'daysInStage',
      header: 'Days in Stage',
      render: (row) => (
        <span className={`text-sm font-mono ${row.daysInStage > 20 ? 'text-score-low font-bold' : 'text-text-primary'}`}>
          {row.daysInStage}d
        </span>
      ),
    },
    {
      key: 'documents',
      header: 'Documents',
      render: (row) => {
        const { completed, total } = row.documentProgress
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full bg-surface-sunken overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-score-high transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-mono text-text-muted">{completed}/{total}</span>
          </div>
        )
      },
    },
    {
      key: 'applicationCount',
      header: 'Applications',
      render: (row) => (
        <span className="text-sm font-mono text-text-primary">{row.applicationCount}</span>
      ),
    },
    {
      key: 'lastTouchpoint',
      header: 'Last Contact',
      render: (row) => row.lastCounsellorTouchpoint ? (
        <span className="text-xs text-text-secondary font-mono">{formatDate(row.lastCounsellorTouchpoint)}</span>
      ) : (
        <span className="text-xs text-text-muted">—</span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Student Metrics"
        description="Stage distribution, document progress, and counsellor touchpoints per student."
        badge={students ? <Badge variant="muted">{students.length} students</Badge> : null}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : !students?.length ? (
        <EmptyState
          title="No students found"
          description="Student analytics will appear once students are created in the system."
          icon={
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="18" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="currentColor" strokeWidth="2" />
            </svg>
          }
        />
      ) : (
        <div className="bg-surface-raised rounded-xl border border-border overflow-hidden">
          <Table
            columns={columns}
            data={students}
            rowKey={(row) => row.id}
            onRowClick={(row) => router.push(`/analytics/students/${row.id}`)}
          />
        </div>
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
