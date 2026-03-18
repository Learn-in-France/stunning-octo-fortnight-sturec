'use client'

import { useRouter } from 'next/navigation'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { RequirementStatus, RequirementSource } from '@sturec/shared'
import { useStudentPortalRequirements } from '@/features/student-portal/hooks/use-student-portal'

const STATUS_CONFIG: Record<RequirementStatus, { label: string; variant: 'success' | 'warning' | 'info' | 'danger' | 'muted' | 'primary' }> = {
  verified: { label: 'Verified', variant: 'success' },
  uploaded: { label: 'Under Review', variant: 'info' },
  requested: { label: 'Requested', variant: 'warning' },
  rejected: { label: 'Needs Re-upload', variant: 'danger' },
  missing: { label: 'Not Uploaded', variant: 'muted' },
  waived: { label: 'Waived', variant: 'muted' },
}

const SOURCE_LABELS: Record<RequirementSource, string> = {
  visa: 'Visa',
  admission: 'Admission',
  housing: 'Housing',
  custom: 'Custom',
}

function formatDate(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function ChecklistPage() {
  const router = useRouter()
  const { data: requirements, isLoading } = useStudentPortalRequirements()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const reqs = requirements ?? []
  const completed = reqs.filter((r) => r.status === 'verified' || r.status === 'waived').length
  const total = reqs.filter((r) => r.required).length
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary font-display tracking-tight">
            Document Checklist
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Required documents for your application and visa process.
          </p>
        </div>
      </div>

      {/* Progress overview */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-text-primary font-display">
              Completion Progress
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {completed} of {total} required documents verified
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-40 h-2.5 rounded-full bg-surface-sunken overflow-hidden">
              <div
                className="h-2.5 rounded-full bg-primary-600 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-sm font-mono font-semibold text-text-primary">
              {progressPercent}%
            </span>
          </div>
        </div>
      </Card>

      {/* Requirements list */}
      <div className="space-y-3">
        {reqs.map((req) => {
          const config = STATUS_CONFIG[req.status]
          const isActionable = req.status === 'missing' || req.status === 'rejected' || req.status === 'requested'

          return (
            <Card key={req.id}>
              <div className="flex items-start gap-4">
                {/* Status indicator */}
                <div className="shrink-0 mt-0.5">
                  {req.status === 'verified' || req.status === 'waived' ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7L6 10L11 4" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  ) : req.status === 'rejected' ? (
                    <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M4 4L10 10M4 10L10 4" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  ) : req.status === 'uploaded' ? (
                    <div className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="5" stroke="#0284C7" strokeWidth="1.5" />
                        <path d="M7 4.5V7.5H9.5" stroke="#0284C7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-text-primary font-display">
                      {req.documentType}
                    </p>
                    <Badge variant={config.variant}>
                      {config.label}
                    </Badge>
                    <Badge variant="muted">
                      {SOURCE_LABELS[req.requirementSource]}
                    </Badge>
                    {req.required && (
                      <span className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider">
                        Required
                      </span>
                    )}
                  </div>
                  {req.notes && (
                    <p className="text-xs text-text-muted mt-1">{req.notes}</p>
                  )}
                  {req.dueDate && (
                    <p className="text-xs text-text-muted mt-0.5">
                      Due: <span className="font-mono">{formatDate(req.dueDate)}</span>
                    </p>
                  )}
                </div>

                {/* Action */}
                {isActionable && (
                  <div className="shrink-0">
                    <Button
                      size="sm"
                      variant={req.status === 'rejected' ? 'primary' : 'secondary'}
                      onClick={() => router.push('/portal/documents')}
                    >
                      {req.status === 'rejected' ? 'Re-upload' : 'Upload'}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
