'use client'

import { useAuth } from '@/providers/auth-provider'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle, CardValue } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAnalyticsOverview } from '@/features/analytics/hooks/use-analytics'
import { STAGE_DISPLAY_NAMES } from '@sturec/shared'

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: overview, isLoading } = useAnalyticsOverview()

  const greeting = getGreeting()
  const leads = overview?.data.leads
  const students = overview?.data.students
  const apps = overview?.data.applications
  const docs = overview?.data.documents

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${user?.firstName ?? 'there'}`}
        description="Here's what's happening with your pipeline today."
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI cards */}
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
                <CardTitle>Qualified Leads</CardTitle>
              </CardHeader>
              <CardValue>{leads?.qualified ?? 0}</CardValue>
              <p className="text-xs text-text-muted mt-1">Ready for counsellor assignment</p>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Students</CardTitle>
              </CardHeader>
              <CardValue>{students?.active ?? 0}</CardValue>
              <p className="text-xs text-text-muted mt-1">Across all stages</p>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Documents</CardTitle>
              </CardHeader>
              <CardValue className={docs?.pending ? 'text-score-low' : ''}>
                {docs?.pending ?? 0}
              </CardValue>
              <p className="text-xs text-text-muted mt-1">Awaiting review</p>
            </Card>
          </div>

          {/* Pipeline breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Lead Pipeline */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Pipeline</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {([
                  { key: 'new', label: 'New', color: 'bg-status-new' },
                  { key: 'qualified', label: 'Qualified', color: 'bg-status-qualified' },
                  { key: 'converted', label: 'Converted', color: 'bg-status-converted' },
                  { key: 'disqualified', label: 'Disqualified', color: 'bg-status-disqualified' },
                ] as const).map(({ key, label, color }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${color}`} />
                      <span className="text-sm text-text-secondary">{label}</span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-text-primary">
                      {leads?.[key] ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Applications Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Applications</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {([
                  { label: 'Submitted', value: apps?.submitted ?? 0, variant: 'info' as const },
                  { label: 'Offers', value: apps?.offers ?? 0, variant: 'success' as const },
                  { label: 'Enrolled', value: apps?.enrolled ?? 0, variant: 'success' as const },
                ]).map(({ label, value, variant }) => {
                  const total = apps?.total ?? 1
                  const pct = total > 0 ? Math.round((value / total) * 100) : 0
                  return (
                    <div key={label} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={variant} dot>
                            {label}
                          </Badge>
                        </div>
                        <span className="text-sm font-mono font-semibold text-text-primary">{value}</span>
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
          </div>

          {/* Student stages */}
          <Card>
            <CardHeader>
              <CardTitle>Students by Stage</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(students?.byStage ?? {}).map(([stage, count]) => (
                <div
                  key={stage}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-sunken/50"
                >
                  <span className="text-xs text-text-secondary truncate pr-2">
                    {STAGE_DISPLAY_NAMES[stage as keyof typeof STAGE_DISPLAY_NAMES] ?? stage}
                  </span>
                  <span className="text-sm font-mono font-bold text-text-primary shrink-0">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
