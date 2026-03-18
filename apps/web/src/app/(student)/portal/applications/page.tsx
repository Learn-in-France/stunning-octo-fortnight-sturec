'use client'

import Link from 'next/link'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { ApplicationStatus } from '@sturec/shared'
import { useStudentPortalApplications } from '@/features/student-portal/hooks/use-student-portal'

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; variant: 'muted' | 'info' | 'success' | 'danger' | 'primary' }> = {
  draft: { label: 'Draft', variant: 'muted' },
  submitted: { label: 'Submitted', variant: 'info' },
  offer: { label: 'Offer Received', variant: 'success' },
  rejected: { label: 'Not Successful', variant: 'danger' },
  enrolled: { label: 'Enrolled', variant: 'primary' },
}

function formatDate(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function ApplicationsPage() {
  const { data: applications, isLoading } = useStudentPortalApplications()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary font-display tracking-tight">
            My Applications
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Track your program applications and their status.
          </p>
        </div>
        {applications && applications.length > 0 && (
          <Badge variant="muted">{applications.length} application{applications.length !== 1 ? 's' : ''}</Badge>
        )}
      </div>

      {!applications?.length ? (
        <Card padding="none">
          <EmptyState
            title="No applications yet"
            description="Your applications will appear here once your counsellor starts the process."
            icon={
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect x="6" y="4" width="28" height="32" rx="4" stroke="currentColor" strokeWidth="2" />
                <path d="M12 14H28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 20H28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 26H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const config = STATUS_CONFIG[app.status]
            return (
              <Card key={app.id}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-text-primary font-display">
                        {app.programName}
                      </h3>
                      <Badge variant={config.variant} dot>
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-text-muted mt-1">
                      {app.universityName}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                      {app.intakeName && (
                        <span>Intake: {app.intakeName}</span>
                      )}
                      {app.submittedAt && (
                        <span>Submitted: {formatDate(app.submittedAt)}</span>
                      )}
                      {app.decisionAt && (
                        <span>Decision: {formatDate(app.decisionAt)}</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <Link
                      href={`/portal/applications/${app.id}`}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-sunken transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
