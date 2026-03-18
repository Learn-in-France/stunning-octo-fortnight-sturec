'use client'

import { use } from 'react'
import Link from 'next/link'

import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { ApplicationStatus } from '@sturec/shared'
import { useStudentPortalApplication } from '@/features/student-portal/hooks/use-student-portal'

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

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: app, isLoading } = useStudentPortalApplication(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!app) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted">Application not found.</p>
        <Link href="/portal/applications" className="text-sm text-primary-600 hover:underline mt-2 inline-block">
          Back to applications
        </Link>
      </div>
    )
  }

  const config = STATUS_CONFIG[app.status]

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-text-muted mb-4">
        <Link href="/portal/applications" className="hover:text-primary-600 transition-colors">
          Applications
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{app.programName}</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-text-primary font-display tracking-tight">
            {app.programName}
          </h1>
          <Badge variant={config.variant} dot>
            {config.label}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-text-muted">
          {app.universityName}
        </p>
      </div>

      <div className="space-y-6">
        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label="Program" value={app.programName} />
            <DetailField label="University" value={app.universityName} />
            <DetailField label="Intake" value={app.intakeName} />
            <DetailField label="Status" value={config.label} />
            <DetailField label="Submitted" value={app.submittedAt ? formatDate(app.submittedAt) : 'Not yet submitted'} />
            <DetailField label="Decision" value={app.decisionAt ? formatDate(app.decisionAt) : 'Pending'} />
            <DetailField label="Created" value={formatDate(app.createdAt)} />
          </div>
        </Card>

        {/* Status-specific guidance */}
        {app.status === 'offer' && (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <p className="text-sm font-medium text-emerald-800 mb-1">Congratulations!</p>
            <p className="text-xs text-emerald-700 leading-relaxed">
              You have received an offer. Contact your counsellor to discuss next steps, including accepting the offer and starting the visa preparation process.
            </p>
          </div>
        )}

        {app.status === 'rejected' && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200">
            <p className="text-sm font-medium text-rose-800 mb-1">Application not successful</p>
            <p className="text-xs text-rose-700 leading-relaxed">
              Unfortunately this application was not successful. Your counsellor can discuss alternative options and help with any other applications.
            </p>
          </div>
        )}

        {app.status === 'draft' && (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-sm font-medium text-amber-800 mb-1">Draft application</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              This application has not been submitted yet. Your counsellor will help finalize and submit it when ready.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm text-text-primary">
        {value ?? <span className="text-text-muted italic">Not available</span>}
      </p>
    </div>
  )
}
