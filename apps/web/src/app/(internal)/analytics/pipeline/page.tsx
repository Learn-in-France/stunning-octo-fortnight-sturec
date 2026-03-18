'use client'

import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle, CardValue } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { STAGE_DISPLAY_NAMES } from '@sturec/shared'
import { usePipelineMetrics } from '@/features/analytics/hooks/use-analytics'

const FUNNEL_COLORS = [
  'bg-status-new',
  'bg-status-nurturing',
  'bg-status-qualified',
  'bg-status-converted',
  'bg-primary-500',
  'bg-primary-400',
  'bg-primary-300',
  'bg-primary-200',
]

export default function PipelineAnalyticsPage() {
  const { data: pipeline, isLoading } = usePipelineMetrics()

  const funnel = pipeline?.data.funnel ?? []
  const conversionRate = pipeline?.data.conversionRate
  const avgDays = pipeline?.data.averageDaysInStage ?? {}
  const totalEntries = funnel[0]?.count ?? 1

  return (
    <div>
      <PageHeader
        title="Pipeline Analytics"
        description="Conversion funnel, stage durations, and pipeline velocity."
        badge={pipeline ? <Badge variant="muted">{pipeline.period.from} — {pipeline.period.to}</Badge> : null}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Velocity KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Funnel Entries</CardTitle>
              </CardHeader>
              <CardValue>{totalEntries}</CardValue>
              <p className="text-xs text-text-muted mt-1">Top of funnel in period</p>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>End of Funnel</CardTitle>
              </CardHeader>
              <CardValue>{funnel[funnel.length - 1]?.count ?? 0}</CardValue>
              <p className="text-xs text-text-muted mt-1">Arrived / Alumni</p>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Overall Conversion Rate</CardTitle>
              </CardHeader>
              <CardValue>{conversionRate != null ? `${conversionRate.toFixed(1)}%` : '—'}</CardValue>
              <p className="text-xs text-text-muted mt-1">Lead to arrived/alumni</p>
            </Card>
          </div>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Student Lifecycle Funnel</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              {funnel.map((stage, i) => {
                const pct = totalEntries > 0 ? Math.round((stage.count / totalEntries) * 100) : 0
                const dropoff = i > 0 ? funnel[i - 1].count - stage.count : null
                const color = FUNNEL_COLORS[i % FUNNEL_COLORS.length]
                const displayName = STAGE_DISPLAY_NAMES[stage.stage as keyof typeof STAGE_DISPLAY_NAMES] ?? stage.stage

                return (
                  <div key={stage.stage}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                        <span className="text-sm font-medium text-text-primary">{displayName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-bold text-text-primary">
                          {stage.count}
                        </span>
                        <Badge variant={pct >= 60 ? 'success' : pct >= 30 ? 'warning' : 'danger'}>
                          {pct}%
                        </Badge>
                        {dropoff !== null && dropoff > 0 && (
                          <span className="text-xs text-text-muted">
                            -{dropoff} dropped
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full h-3 rounded-full bg-surface-sunken overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-700 ${color}`}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Average Time Between Stages */}
          {Object.keys(avgDays).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Average Time in Stage</CardTitle>
              </CardHeader>
              <div className="divide-y divide-border/60">
                {Object.entries(avgDays).map(([stage, days]) => {
                  const displayName = STAGE_DISPLAY_NAMES[stage as keyof typeof STAGE_DISPLAY_NAMES] ?? stage
                  const maxDays = Math.max(...Object.values(avgDays))
                  const barPct = maxDays > 0 ? Math.round((days / maxDays) * 100) : 0
                  const isLong = days > 20

                  return (
                    <div key={stage} className="flex items-center gap-3 py-2.5">
                      <span className="text-xs text-text-secondary w-52 shrink-0 truncate">
                        {displayName}
                      </span>
                      <div className="flex-1 h-4 rounded bg-surface-sunken overflow-hidden">
                        <div
                          className={`h-4 rounded transition-all duration-500 ${
                            isLong ? 'bg-score-low/70' : 'bg-primary-400/70'
                          }`}
                          style={{ width: `${Math.max(barPct, 4)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-mono font-bold shrink-0 w-16 text-right ${
                        isLong ? 'text-score-low' : 'text-text-primary'
                      }`}>
                        {days.toFixed(1)}d
                      </span>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
