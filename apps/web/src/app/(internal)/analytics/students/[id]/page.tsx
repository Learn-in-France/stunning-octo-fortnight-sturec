'use client'

import { use } from 'react'
import Link from 'next/link'

import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle, CardValue } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { STAGE_DISPLAY_NAMES, STAGE_ORDER } from '@sturec/shared'
import { useStudentAnalyticsDetail } from '@/features/analytics/hooks/use-analytics'

export default function StudentDetailAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: detail, isLoading } = useStudentAnalyticsDetail(id)

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
        <p className="text-text-muted">Student not found.</p>
      </div>
    )
  }

  const fullName = `${detail.firstName} ${detail.lastName}`
  const currentStageIndex = STAGE_ORDER.indexOf(detail.stage as (typeof STAGE_ORDER)[number])
  const docPct = detail.documentProgress.total > 0
    ? Math.round((detail.documentProgress.completed / detail.documentProgress.total) * 100)
    : 0

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-text-muted mb-4">
        <Link href="/analytics/students" className="hover:text-primary-600 transition-colors">
          Student Metrics
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{fullName}</span>
      </div>

      <PageHeader
        title={fullName}
        description="Individual student progression timeline and readiness trends."
        badge={<Badge variant="primary">{detail.referenceCode}</Badge>}
      />

      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Stage</CardTitle>
            </CardHeader>
            <p className="text-lg font-bold text-text-primary font-display">
              {STAGE_DISPLAY_NAMES[detail.stage as keyof typeof STAGE_DISPLAY_NAMES] ?? detail.stage}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {currentStageIndex >= 0
                ? `Stage ${currentStageIndex + 1} of ${STAGE_ORDER.length}`
                : 'Unknown position'}
            </p>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Days in Stage</CardTitle>
            </CardHeader>
            <CardValue className={detail.daysInStage > 20 ? 'text-score-low' : ''}>
              {detail.daysInStage}
            </CardValue>
            <p className="text-xs text-text-muted mt-1">
              {detail.daysInStage > 20 ? 'Exceeds average' : 'Within normal range'}
            </p>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document Completion</CardTitle>
            </CardHeader>
            <CardValue>{docPct}%</CardValue>
            <p className="text-xs text-text-muted mt-1">
              {detail.documentProgress.completed} of {detail.documentProgress.total} verified
            </p>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
            </CardHeader>
            <CardValue>{detail.applications.total}</CardValue>
            <p className="text-xs text-text-muted mt-1">
              {detail.applications.offers} offers, {detail.applications.enrolled} enrolled
            </p>
          </Card>
        </div>

        {/* Stage Progression Timeline */}
        {detail.stageHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Stage Progression Timeline</CardTitle>
            </CardHeader>
            <div className="relative">
              {/* Progress track */}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

              <div className="space-y-0">
                {STAGE_ORDER.map((stage, i) => {
                  const historyEntry = detail.stageHistory.find((h) => h.stage === stage)
                  const isPast = i < currentStageIndex
                  const isCurrent = i === currentStageIndex
                  const isFuture = i > currentStageIndex

                  return (
                    <div key={stage} className="relative flex items-start gap-4 py-2.5">
                      {/* Dot */}
                      <div className={`
                        relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0
                        ${isCurrent
                          ? 'border-primary-500 bg-primary-500'
                          : isPast
                            ? 'border-primary-400 bg-primary-100'
                            : 'border-border bg-surface-raised'
                        }
                      `}>
                        {isPast && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600" />
                          </svg>
                        )}
                        {isCurrent && (
                          <span className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${
                            isCurrent ? 'text-primary-600' :
                            isPast ? 'text-text-primary' : 'text-text-muted'
                          }`}>
                            {STAGE_DISPLAY_NAMES[stage]}
                          </span>
                          {isCurrent && <Badge variant="primary">Current</Badge>}
                        </div>
                        {historyEntry && (
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-text-muted">
                              {formatDate(historyEntry.enteredAt)}
                            </span>
                            <span className="text-xs text-text-muted">
                              {historyEntry.daysInStage} days in stage
                            </span>
                          </div>
                        )}
                        {isFuture && !historyEntry && (
                          <span className="text-xs text-text-muted">Not yet reached</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Document Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Document Progress</CardTitle>
            <Badge variant="muted">
              {detail.documentProgress.completed}/{detail.documentProgress.total} verified
            </Badge>
          </CardHeader>
          <div className="w-full h-2 rounded-full bg-surface-sunken overflow-hidden">
            <div
              className="h-2 rounded-full bg-score-high transition-all duration-500"
              style={{ width: `${docPct}%` }}
            />
          </div>
        </Card>

        {/* Last Counsellor Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Last Counsellor Contact</CardTitle>
          </CardHeader>
          <p className="text-sm text-text-secondary">
            {detail.lastCounsellorTouchpoint
              ? formatDate(detail.lastCounsellorTouchpoint)
              : 'No counsellor contact recorded'}
          </p>
        </Card>
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
