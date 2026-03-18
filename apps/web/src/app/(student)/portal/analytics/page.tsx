'use client'

import { Card, CardHeader, CardTitle, CardValue } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StageBadge } from '@/components/shared/stage-badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { STAGE_ORDER, STAGE_DISPLAY_NAMES } from '@sturec/shared'
import { useStudentProgress } from '@/features/student-portal/hooks/use-student-portal'

export default function AnalyticsPage() {
  const { data: progress, isLoading } = useStudentProgress()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!progress) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted">Could not load your progress.</p>
      </div>
    )
  }

  const currentStageIndex = STAGE_ORDER.indexOf(progress.stage as (typeof STAGE_ORDER)[number])

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary font-display tracking-tight">
          My Progress
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Track your journey from application to arrival in France.
        </p>
      </div>

      <div className="space-y-6">
        {/* Overall progress */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
            <StageBadge stage={progress.stage} />
          </CardHeader>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Journey Completion</span>
              <span className="text-sm font-mono font-semibold text-text-primary">
                {progress.progressPercent}%
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-surface-sunken overflow-hidden">
              <div
                className="h-3 rounded-full bg-primary-600 transition-all duration-700"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-text-muted">
            {currentStageIndex >= 0
              ? `Stage ${currentStageIndex + 1} of ${STAGE_ORDER.length} — ${STAGE_DISPLAY_NAMES[progress.stage as keyof typeof STAGE_DISPLAY_NAMES] ?? progress.stage}`
              : ''}
          </p>
        </Card>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
            </CardHeader>
            <CardValue>{progress.applications.total}</CardValue>
            <p className="text-xs text-text-muted mt-1">
              {progress.applications.offers} offer{progress.applications.offers !== 1 ? 's' : ''} received
            </p>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardValue>
              {progress.documentChecklist.completed}
              <span className="text-sm font-normal text-text-muted">/{progress.documentChecklist.total}</span>
            </CardValue>
            <p className="text-xs text-text-muted mt-1">Verified</p>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
            </CardHeader>
            <CardValue>{progress.completedMilestones.length}</CardValue>
            <p className="text-xs text-text-muted mt-1">Completed</p>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Visa Status</CardTitle>
            </CardHeader>
            <p className="text-sm font-medium text-text-primary mt-1">
              {progress.visa.status ?? 'Not started'}
            </p>
            <p className="text-xs text-text-muted mt-1">Current status</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Stage journey */}
          <Card>
            <CardHeader>
              <CardTitle>Stage Journey</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {STAGE_ORDER.map((stage, idx) => {
                const isPast = idx < currentStageIndex
                const isCurrent = idx === currentStageIndex
                const isFuture = idx > currentStageIndex

                return (
                  <div key={stage} className="flex items-center gap-3">
                    {/* Step indicator */}
                    <div className="shrink-0 flex flex-col items-center">
                      <div
                        className={`
                          w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
                          ${isPast ? 'bg-emerald-100 text-emerald-700' : ''}
                          ${isCurrent ? 'bg-primary-600 text-white ring-2 ring-primary-200' : ''}
                          ${isFuture ? 'bg-gray-100 text-gray-400' : ''}
                        `}
                      >
                        {isPast ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          idx + 1
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-xs truncate ${
                        isCurrent
                          ? 'font-semibold text-text-primary'
                          : isPast
                            ? 'text-text-secondary'
                            : 'text-text-muted'
                      }`}
                    >
                      {STAGE_DISPLAY_NAMES[stage]}
                    </span>
                    {isCurrent && (
                      <Badge variant="primary" className="ml-auto shrink-0">Current</Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Milestones + next actions */}
          <div className="space-y-4">
            {progress.completedMilestones.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Completed Milestones</CardTitle>
                </CardHeader>
                <div className="space-y-2">
                  {progress.completedMilestones.map((milestone, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5L4 7L8 3" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="text-sm text-text-secondary">{milestone}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {progress.nextActions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>What is Next</CardTitle>
                </CardHeader>
                <div className="space-y-2">
                  {progress.nextActions.map((action, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      </div>
                      <span className="text-sm text-text-primary">{action}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
