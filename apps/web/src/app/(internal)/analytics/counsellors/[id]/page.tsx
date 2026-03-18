'use client'

import { use } from 'react'
import Link from 'next/link'

import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle, CardValue } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { STAGE_DISPLAY_NAMES, STAGE_ORDER } from '@sturec/shared'
import { useCounsellorAnalyticsDetail } from '@/features/analytics/hooks/use-analytics'

export default function CounsellorDetailAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: detail, isLoading } = useCounsellorAnalyticsDetail(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted">Counsellor not found.</p>
      </div>
    )
  }

  const maxCaseload = Math.max(...Object.values(detail.studentStages), 1)

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-text-muted mb-4">
        <Link href="/analytics/counsellors" className="hover:text-primary-600 transition-colors">
          Counsellor Performance
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{detail.name}</span>
      </div>

      <PageHeader
        title={detail.name}
        description="Individual counsellor performance metrics and caseload."
        badge={<Badge variant="muted">{detail.period.from} — {detail.period.to}</Badge>}
      />

      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Leads</CardTitle>
            </CardHeader>
            <CardValue>{detail.caseload.leads}</CardValue>
            <p className="text-xs text-text-muted mt-1">Currently assigned</p>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Students</CardTitle>
            </CardHeader>
            <CardValue>{detail.caseload.students}</CardValue>
            <p className="text-xs text-text-muted mt-1">Across all stages</p>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activities by Type</CardTitle>
            </CardHeader>
            <CardValue>{Object.values(detail.activityByType).reduce((s, c) => s + c, 0)}</CardValue>
            <p className="text-xs text-text-muted mt-1">
              {Object.keys(detail.activityByType).length} types
            </p>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activities by Channel</CardTitle>
            </CardHeader>
            <CardValue>{Object.values(detail.activityByChannel).reduce((s, c) => s + c, 0)}</CardValue>
            <p className="text-xs text-text-muted mt-1">
              {Object.keys(detail.activityByChannel).length} channels
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Activity by Type */}
          {Object.keys(detail.activityByType).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Activity by Type</CardTitle>
              </CardHeader>
              <div className="space-y-2">
                {Object.entries(detail.activityByType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-text-secondary capitalize">
                        {type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm font-mono font-bold text-text-primary">{count}</span>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {/* Activity by Channel */}
          {Object.keys(detail.activityByChannel).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Activity by Channel</CardTitle>
              </CardHeader>
              <div className="space-y-2">
                {Object.entries(detail.activityByChannel)
                  .sort(([, a], [, b]) => b - a)
                  .map(([channel, count]) => (
                    <div key={channel} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-text-secondary capitalize">
                        {channel.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm font-mono font-bold text-text-primary">{count}</span>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </div>

        {/* Caseload by Stage */}
        <Card>
          <CardHeader>
            <CardTitle>Caseload by Stage</CardTitle>
            <Badge variant="muted">
              {Object.values(detail.studentStages).reduce((a, b) => a + b, 0)} total
            </Badge>
          </CardHeader>
          <div className="space-y-2">
            {STAGE_ORDER.map((stage) => {
              const count = detail.studentStages[stage] ?? 0
              const barPct = Math.round((count / maxCaseload) * 100)
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary w-48 shrink-0 truncate">
                    {STAGE_DISPLAY_NAMES[stage]}
                  </span>
                  <div className="flex-1 h-5 rounded bg-surface-sunken overflow-hidden">
                    {count > 0 ? (
                      <div
                        className="h-5 rounded bg-primary-400/70 transition-all duration-500 flex items-center px-2"
                        style={{ width: `${Math.max(barPct, 12)}%` }}
                      >
                        <span className="text-[10px] font-mono font-bold text-primary-900">
                          {count}
                        </span>
                      </div>
                    ) : (
                      <div className="h-5 flex items-center px-2">
                        <span className="text-[10px] font-mono text-text-muted">0</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Recent Activity */}
        {detail.recentActivities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <div className="space-y-0 divide-y divide-border/60">
              {detail.recentActivities.map((item) => (
                <div key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="pt-0.5">
                    <span className="block w-2 h-2 rounded-full bg-primary-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary capitalize">
                      {item.activityType.replace(/_/g, ' ')}
                    </p>
                    {item.summary && (
                      <p className="text-xs text-text-muted truncate">{item.summary}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-text-muted whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </span>
                    <p className="text-[10px] text-text-muted capitalize">{item.channel}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
