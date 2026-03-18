'use client'

import Link from 'next/link'

import { useAuth } from '@/providers/auth-provider'
import { Card, CardHeader, CardTitle, CardValue } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StageBadge } from '@/components/shared/stage-badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { STAGE_ORDER } from '@sturec/shared'
import { useStudentProgress } from '@/features/student-portal/hooks/use-student-portal'

export default function PortalPage() {
  const { user } = useAuth()
  const { data: progress, isLoading } = useStudentProgress()
  const greeting = getGreeting()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const stageIndex = progress
    ? STAGE_ORDER.indexOf(progress.stage as (typeof STAGE_ORDER)[number])
    : -1

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary font-display tracking-tight">
          {greeting}, {user?.firstName ?? 'there'}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Here is an overview of your study-in-France journey.
        </p>
      </div>

      <div className="space-y-6">
        {/* Current stage card */}
        {progress && (
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Current Stage
                </p>
                <div className="flex items-center gap-3">
                  <StageBadge stage={progress.stage} />
                  <span className="text-sm text-text-secondary">
                    {stageIndex >= 0 ? `Step ${stageIndex + 1} of ${STAGE_ORDER.length}` : ''}
                  </span>
                </div>
              </div>
              <div className="sm:text-right">
                <p className="text-xs text-text-muted mb-1">Overall Progress</p>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 rounded-full bg-surface-sunken overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-primary-600 transition-all duration-500"
                      style={{ width: `${progress.progressPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono font-semibold text-text-primary">
                    {progress.progressPercent}%
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Quick stats */}
        {progress && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Applications</CardTitle>
              </CardHeader>
              <CardValue>{progress.applications.total}</CardValue>
              <p className="text-xs text-text-muted mt-1">
                {progress.applications.offers} {progress.applications.offers === 1 ? 'offer' : 'offers'} received
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
              <p className="text-xs text-text-muted mt-1">Verified documents</p>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Visa</CardTitle>
              </CardHeader>
              <CardValue className="text-base">
                {progress.visa.status ?? 'Not started'}
              </CardValue>
              <p className="text-xs text-text-muted mt-1">Current visa status</p>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Next actions */}
          {progress && progress.nextActions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Next Actions</CardTitle>
                <Badge variant="muted">{progress.nextActions.length}</Badge>
              </CardHeader>
              <div className="space-y-3">
                {progress.nextActions.map((action, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-surface-sunken/50"
                  >
                    <div className="mt-0.5 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-amber-500 block" />
                    </div>
                    <p className="text-sm text-text-primary flex-1">{action}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Milestones */}
          {progress && progress.completedMilestones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Completed Milestones</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {progress.completedMilestones.map((milestone, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="mt-1 shrink-0">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" className="text-score-high" />
                        <path d="M4 7L6 9L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-score-high" />
                      </svg>
                    </div>
                    <p className="text-sm text-text-primary flex-1">{milestone}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Applications', href: '/portal/applications' },
            { label: 'Documents', href: '/portal/documents' },
            { label: 'Checklist', href: '/portal/checklist' },
            { label: 'Bookings', href: '/portal/bookings' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="p-4 rounded-xl border border-border bg-surface-raised text-center text-sm font-medium text-text-primary hover:bg-surface-sunken transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
