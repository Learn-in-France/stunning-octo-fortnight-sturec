'use client'

import { useRouter } from 'next/navigation'

import type { CounsellorAnalyticsItem } from '@sturec/shared'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, type Column } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useCounsellorAnalytics } from '@/features/analytics/hooks/use-analytics'

export default function CounsellorAnalyticsPage() {
  const router = useRouter()
  const { data: counsellors, isLoading } = useCounsellorAnalytics()

  const maxWorkload = Math.max(
    ...(counsellors?.map((c) => c.assignedLeads + c.assignedStudents) ?? [1]),
  )

  const columns: Column<CounsellorAnalyticsItem>[] = [
    {
      key: 'name',
      header: 'Counsellor',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-text-primary">{row.name}</p>
          <p className="text-xs text-text-muted">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'assignedLeads',
      header: 'Leads',
      render: (row) => (
        <span className="text-sm font-mono text-text-primary">{row.assignedLeads}</span>
      ),
    },
    {
      key: 'assignedStudents',
      header: 'Students',
      render: (row) => (
        <span className="text-sm font-mono text-text-primary">{row.assignedStudents}</span>
      ),
    },
    {
      key: 'conversionRate',
      header: 'Conversion',
      render: (row) => row.conversionRate != null ? (
        <Badge variant={row.conversionRate >= 0.6 ? 'success' : row.conversionRate >= 0.4 ? 'warning' : 'danger'}>
          {(row.conversionRate * 100).toFixed(0)}%
        </Badge>
      ) : (
        <span className="text-xs text-text-muted">—</span>
      ),
    },
    {
      key: 'activityCount',
      header: 'Activities',
      render: (row) => (
        <span className="text-sm font-mono text-text-primary">{row.activityCount}</span>
      ),
    },
    {
      key: 'overdueActions',
      header: 'Overdue',
      render: (row) => (
        <span className={`text-sm font-mono ${row.overdueActions > 0 ? 'text-score-low font-bold' : 'text-text-muted'}`}>
          {row.overdueActions}
        </span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Counsellor Performance"
        description="Workload distribution, conversion rates, and activity metrics by counsellor."
        badge={counsellors ? <Badge variant="muted">{counsellors.length} counsellors</Badge> : null}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : !counsellors?.length ? (
        <EmptyState
          title="No counsellors found"
          description="Counsellor metrics will appear once team members with the counsellor role are active."
          icon={
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="18" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="currentColor" strokeWidth="2" />
            </svg>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Performance Table */}
          <div className="bg-surface-raised rounded-xl border border-border overflow-hidden">
            <Table
              columns={columns}
              data={counsellors}
              rowKey={(row) => row.id}
              onRowClick={(row) => router.push(`/analytics/counsellors/${row.id}`)}
            />
          </div>

          {/* Workload Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Workload Distribution</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              {counsellors.map((c) => {
                const totalLoad = c.assignedLeads + c.assignedStudents
                const leadPct = maxWorkload > 0 ? Math.round((c.assignedLeads / maxWorkload) * 100) : 0
                const studentPct = maxWorkload > 0 ? Math.round((c.assignedStudents / maxWorkload) * 100) : 0
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-text-primary">{c.name}</span>
                      <span className="text-xs text-text-muted">{totalLoad} total assigned</span>
                    </div>
                    <div className="flex h-4 rounded-full bg-surface-sunken overflow-hidden">
                      <div
                        className="h-4 bg-primary-500 transition-all duration-500"
                        style={{ width: `${leadPct}%` }}
                        title={`${c.assignedLeads} leads`}
                      />
                      <div
                        className="h-4 bg-primary-300 transition-all duration-500"
                        style={{ width: `${studentPct}%` }}
                        title={`${c.assignedStudents} students`}
                      />
                    </div>
                    <div className="flex gap-4 mt-1">
                      <span className="text-[10px] text-text-muted flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary-500" />
                        Leads ({c.assignedLeads})
                      </span>
                      <span className="text-[10px] text-text-muted flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary-300" />
                        Students ({c.assignedStudents})
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
