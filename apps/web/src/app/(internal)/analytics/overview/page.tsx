'use client'

import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle, CardValue } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { STAGE_DISPLAY_NAMES, STAGE_ORDER } from '@sturec/shared'
import { useAnalyticsOverview } from '@/features/analytics/hooks/use-analytics'

export default function OverviewAnalyticsPage() {
  const { data: overview, isLoading } = useAnalyticsOverview()

  const leads = overview?.data.leads
  const students = overview?.data.students
  const apps = overview?.data.applications
  const docs = overview?.data.documents
  const bookings = overview?.data.bookings

  const conversionRate = leads && leads.total > 0
    ? ((leads.converted / leads.total) * 100).toFixed(1)
    : '0.0'

  return (
    <div>
      <PageHeader
        title="Analytics Overview"
        description="High-level KPIs, trends, and system health across the entire recruitment pipeline."
        badge={overview ? <Badge variant="muted">{overview.period.from} — {overview.period.to}</Badge> : null}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Leads</CardTitle>
              </CardHeader>
              <CardValue>{leads?.total ?? 0}</CardValue>
              <p className="text-xs text-text-muted mt-1">
                <span className="text-score-high font-semibold">{leads?.new ?? 0}</span> new in period
              </p>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Students</CardTitle>
              </CardHeader>
              <CardValue>{students?.active ?? 0}</CardValue>
              <p className="text-xs text-text-muted mt-1">
                {students?.total ?? 0} total across all stages
              </p>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Rate</CardTitle>
              </CardHeader>
              <CardValue>{conversionRate}%</CardValue>
              <p className="text-xs text-text-muted mt-1">Lead to student conversion</p>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Applications</CardTitle>
              </CardHeader>
              <CardValue>{apps?.total ?? 0}</CardValue>
              <p className="text-xs text-text-muted mt-1">
                <span className="text-score-high font-semibold">{apps?.offers ?? 0}</span> offers received
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Lead Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Breakdown</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {([
                  { key: 'new' as const, label: 'New', color: 'bg-status-new' },
                  { key: 'qualified' as const, label: 'Qualified', color: 'bg-status-qualified' },
                  { key: 'converted' as const, label: 'Converted', color: 'bg-status-converted' },
                  { key: 'disqualified' as const, label: 'Disqualified', color: 'bg-status-disqualified' },
                ]).map(({ key, label, color }) => {
                  const count = leads?.[key] ?? 0
                  const total = leads?.total ?? 1
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                          <span className="text-sm text-text-secondary">{label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-bold text-text-primary">{count}</span>
                          <span className="text-xs text-text-muted">{pct}%</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-sunken overflow-hidden">
                        <div
                          className="h-1.5 rounded-full bg-primary-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Documents & Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Operations Snapshot</CardTitle>
              </CardHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-text-muted mb-2">Documents</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-surface-sunken/50 text-center">
                      <p className="text-lg font-bold font-mono text-score-mid">{docs?.pending ?? 0}</p>
                      <p className="text-[10px] text-text-muted">Pending</p>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-sunken/50 text-center">
                      <p className="text-lg font-bold font-mono text-score-high">{docs?.verified ?? 0}</p>
                      <p className="text-[10px] text-text-muted">Verified</p>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-sunken/50 text-center">
                      <p className="text-lg font-bold font-mono text-score-low">{docs?.rejected ?? 0}</p>
                      <p className="text-[10px] text-text-muted">Rejected</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-text-muted mb-2">Bookings</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-surface-sunken/50 text-center">
                      <p className="text-lg font-bold font-mono text-primary-600">{bookings?.scheduled ?? 0}</p>
                      <p className="text-[10px] text-text-muted">Scheduled</p>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-sunken/50 text-center">
                      <p className="text-lg font-bold font-mono text-score-high">{bookings?.completed ?? 0}</p>
                      <p className="text-[10px] text-text-muted">Completed</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Students by Stage */}
          <Card>
            <CardHeader>
              <CardTitle>Students by Stage</CardTitle>
              <Badge variant="muted">{students?.total ?? 0} total</Badge>
            </CardHeader>
            <div className="space-y-2">
              {STAGE_ORDER.map((stage) => {
                const count = students?.byStage[stage] ?? 0
                const maxCount = Math.max(...Object.values(students?.byStage ?? { _: 1 }))
                const barPct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary w-48 shrink-0 truncate">
                      {STAGE_DISPLAY_NAMES[stage]}
                    </span>
                    <div className="flex-1 h-5 rounded bg-surface-sunken overflow-hidden">
                      <div
                        className="h-5 rounded bg-primary-400/70 transition-all duration-500 flex items-center px-2"
                        style={{ width: `${Math.max(barPct, 8)}%` }}
                      >
                        <span className="text-[10px] font-mono font-bold text-primary-900">
                          {count}
                        </span>
                      </div>
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
