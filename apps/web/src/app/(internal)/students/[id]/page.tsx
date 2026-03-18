'use client'

import { use } from 'react'
import Link from 'next/link'

import type { ApplicationListItem, DocumentListItem, DocumentRequirementItem } from '@sturec/shared'
import { STAGE_DISPLAY_NAMES, STAGE_ORDER } from '@sturec/shared'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { Table, type Column } from '@/components/ui/table'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { StageBadge } from '@/components/shared/stage-badge'
import { ScoreBar } from '@/components/shared/score-bar'
import { useStudent } from '@/features/students/hooks/use-students'
import { useStudentApplications } from '@/features/applications/hooks/use-applications'
import { useStudentDocuments, useStudentRequirements, useVerifyDocument, useRejectDocument } from '@/features/documents/hooks/use-documents'

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: student, isLoading, error } = useStudent(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted">Student not found.</p>
        <Link href="/students" className="text-sm text-primary-600 hover:underline mt-2 inline-block">
          Back to students
        </Link>
      </div>
    )
  }

  const stageIndex = STAGE_ORDER.indexOf(student.stage)

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-text-muted mb-4">
        <Link href="/students" className="hover:text-primary-600 transition-colors">
          Students
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{student.fullName}</span>
      </div>

      <PageHeader
        title={student.fullName}
        badge={
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
              {student.referenceCode}
            </span>
            <StageBadge stage={student.stage} />
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary">
              Change Stage
            </Button>
            <Button size="sm" variant="secondary">
              Assign
            </Button>
          </div>
        }
      />

      {/* Stage pipeline */}
      <Card className="mb-6" padding="sm">
        <div className="flex items-center gap-0.5 overflow-x-auto py-1 px-1">
          {STAGE_ORDER.map((s, idx) => {
            const isCurrent = s === student.stage
            const isPast = idx < stageIndex
            return (
              <div
                key={s}
                className={`
                  flex-1 min-w-0 px-2 py-1.5 rounded-md text-center text-[10px] font-medium truncate
                  transition-colors
                  ${isCurrent
                    ? 'bg-primary-600 text-white'
                    : isPast
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-surface-sunken text-text-muted'}
                `}
                title={STAGE_DISPLAY_NAMES[s]}
              >
                {STAGE_DISPLAY_NAMES[s]}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Tabbed content */}
      <Tabs
        items={[
          {
            id: 'overview',
            label: 'Overview',
            content: <OverviewTab student={student} />,
          },
          {
            id: 'applications',
            label: 'Applications',
            content: <ApplicationsTab studentId={id} />,
          },
          {
            id: 'documents',
            label: 'Documents',
            content: <DocumentsTab studentId={id} />,
          },
          {
            id: 'ai',
            label: 'AI Assessments',
            content: <PlaceholderTab title="AI Assessments" description="Assessment history with component scores and gap analysis." />,
          },
          {
            id: 'timeline',
            label: 'Timeline',
            content: <PlaceholderTab title="Timeline" description="Unified chronological view of all events." />,
          },
          {
            id: 'notes',
            label: 'Notes',
            content: <PlaceholderTab title="Notes" description="Counsellor notes with type tags." />,
          },
          {
            id: 'contacts',
            label: 'Contacts',
            content: <PlaceholderTab title="Contacts" description="Parent/guardian contact management." />,
          },
          {
            id: 'activity',
            label: 'Activity',
            content: <PlaceholderTab title="Activity Log" description="Counsellor activity tracking." />,
          },
        ]}
      />
    </div>
  )
}

function OverviewTab({ student }: { student: ReturnType<typeof useStudent>['data'] }) {
  if (!student) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Degree Level" value={student.degreeLevel ?? '—'} capitalize />
          <InfoRow label="Bachelor Degree" value={student.bachelorDegree ?? '—'} />
          <InfoRow label="GPA" value={student.gpa?.toString() ?? '—'} />
          <InfoRow label="Graduation Year" value={student.graduationYear?.toString() ?? '—'} />
          <InfoRow label="Work Experience" value={student.workExperienceYears ? `${student.workExperienceYears} years` : '—'} />
          <InfoRow label="Study Gap" value={student.studyGapYears ? `${student.studyGapYears} years` : 'None'} />
          <InfoRow label="English Test" value={student.englishTestType?.toUpperCase() ?? '—'} />
          <InfoRow label="English Score" value={student.englishScore?.toString() ?? '—'} />
          <InfoRow label="Preferred City" value={student.preferredCity ?? '—'} />
          <InfoRow label="Preferred Intake" value={student.preferredIntake?.replace('_', ' ') ?? '—'} />
          <InfoRow label="Budget" value={student.budgetMin && student.budgetMax ? `€${student.budgetMin.toLocaleString()} – €${student.budgetMax.toLocaleString()}` : '—'} />
          <InfoRow label="Funding" value={student.fundingRoute ?? '—'} capitalize />
          <InfoRow label="Housing Needed" value={student.housingNeeded ? 'Yes' : student.housingNeeded === false ? 'No' : '—'} />
          <InfoRow label="Source" value={student.source} capitalize />
        </div>
      </Card>

      {/* Scores + assignment */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Readiness Scores</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <ScoreBar label="Academic Fit" value={student.academicFitScore} />
            <ScoreBar label="Financial Readiness" value={student.financialReadinessScore} />
            <ScoreBar label="Overall Readiness" value={student.overallReadinessScore} max={100} />
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center gap-3">
            <span className="text-xs text-text-muted">Visa Risk:</span>
            <Badge
              variant={
                student.visaRisk === 'low' ? 'success' :
                student.visaRisk === 'medium' ? 'warning' :
                student.visaRisk === 'high' ? 'danger' : 'muted'
              }
              dot
            >
              {student.visaRisk ?? 'Unknown'}
            </Badge>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignment</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <InfoRow label="Counsellor" value={student.counsellorName} />
            <InfoRow label="Assigned" value={student.assignedAt ? formatDate(student.assignedAt) : '—'} />
            <InfoRow label="Stage Updated" value={formatDate(student.stageUpdatedAt)} />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Consents</CardTitle>
          </CardHeader>
          <div className="flex gap-3">
            <ConsentPill label="WhatsApp" granted={student.whatsappConsent} />
            <ConsentPill label="Email" granted={student.emailConsent} />
            <ConsentPill label="Parent Involved" granted={student.parentInvolvement} />
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── Applications Tab ────────────────────────────────────────────

const APP_STATUS_VARIANTS: Record<string, 'muted' | 'info' | 'success' | 'danger'> = {
  draft: 'muted',
  submitted: 'info',
  offer: 'success',
  rejected: 'danger',
  enrolled: 'success',
}

function ApplicationsTab({ studentId }: { studentId: string }) {
  const { data, isLoading } = useStudentApplications(studentId)

  const columns: Column<ApplicationListItem>[] = [
    {
      key: 'program',
      header: 'Program',
      render: (row) => (
        <div>
          <p className="font-medium text-text-primary">{row.programName}</p>
          <p className="text-xs text-text-muted">{row.universityName}</p>
        </div>
      ),
    },
    {
      key: 'intake',
      header: 'Intake',
      render: (row) => row.intakeName ? (
        <span className="text-sm text-text-secondary">{row.intakeName}</span>
      ) : (
        <span className="text-xs text-text-muted">—</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={APP_STATUS_VARIANTS[row.status] ?? 'muted'} dot>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      render: (row) => row.submittedAt ? (
        <span className="text-xs text-text-secondary font-mono">{formatDate(row.submittedAt)}</span>
      ) : (
        <span className="text-xs text-text-muted">—</span>
      ),
    },
    {
      key: 'decisionAt',
      header: 'Decision',
      render: (row) => row.decisionAt ? (
        <span className="text-xs text-text-secondary font-mono">{formatDate(row.decisionAt)}</span>
      ) : (
        <span className="text-xs text-text-muted">Pending</span>
      ),
    },
  ]

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>

  if (!data?.items.length) {
    return (
      <EmptyState
        title="No applications"
        description="This student has no applications yet."
      />
    )
  }

  return (
    <div className="bg-surface-raised rounded-xl border border-border overflow-hidden">
      <Table columns={columns} data={data.items} rowKey={(row) => row.id} />
    </div>
  )
}

// ─── Documents Tab ───────────────────────────────────────────────

const DOC_STATUS_VARIANTS: Record<string, 'muted' | 'info' | 'success' | 'danger' | 'warning'> = {
  pending_upload: 'muted',
  pending: 'warning',
  verified: 'success',
  rejected: 'danger',
}

const REQ_STATUS_VARIANTS: Record<string, 'muted' | 'info' | 'success' | 'danger' | 'warning'> = {
  not_started: 'muted',
  in_progress: 'info',
  submitted: 'warning',
  completed: 'success',
  waived: 'muted',
}

function DocumentsTab({ studentId }: { studentId: string }) {
  const { data: docsData, isLoading: docsLoading } = useStudentDocuments(studentId)
  const { data: reqsData, isLoading: reqsLoading } = useStudentRequirements(studentId)
  const verify = useVerifyDocument(studentId)
  const reject = useRejectDocument(studentId)

  const docColumns: Column<DocumentListItem>[] = [
    {
      key: 'filename',
      header: 'File',
      render: (row) => (
        <div>
          <p className="font-medium text-text-primary">{row.filename}</p>
          <p className="text-xs text-text-muted capitalize">{row.type.replace(/_/g, ' ')}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={DOC_STATUS_VARIANTS[row.status] ?? 'muted'} dot>
          {row.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'isCurrent',
      header: 'Version',
      render: (row) => (
        <span className={`text-xs ${row.isCurrent ? 'text-primary-600 font-medium' : 'text-text-muted'}`}>
          {row.isCurrent ? 'Current' : 'Superseded'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Uploaded',
      render: (row) => (
        <span className="text-xs text-text-muted font-mono">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-32',
      render: (row) => row.status === 'pending' ? (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => verify.mutate({ documentId: row.id })}
            loading={verify.isPending}
          >
            Verify
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => reject.mutate({ documentId: row.id, notes: 'Rejected by counsellor' })}
            loading={reject.isPending}
          >
            Reject
          </Button>
        </div>
      ) : null,
    },
  ]

  const reqColumns: Column<DocumentRequirementItem>[] = [
    {
      key: 'documentType',
      header: 'Document Type',
      render: (row) => (
        <div>
          <p className="font-medium text-text-primary capitalize">{row.documentType.replace(/_/g, ' ')}</p>
          {row.notes && <p className="text-xs text-text-muted line-clamp-1">{row.notes}</p>}
        </div>
      ),
    },
    {
      key: 'required',
      header: 'Required',
      render: (row) => (
        <Badge variant={row.required ? 'danger' : 'muted'}>
          {row.required ? 'Required' : 'Optional'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={REQ_STATUS_VARIANTS[row.status] ?? 'muted'} dot>
          {row.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due',
      render: (row) => row.dueDate ? (
        <span className="text-xs text-text-secondary font-mono">{formatDate(row.dueDate)}</span>
      ) : (
        <span className="text-xs text-text-muted">—</span>
      ),
    },
  ]

  if (docsLoading || reqsLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner /></div>
  }

  return (
    <div className="space-y-6">
      {/* Uploaded Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
          {docsData && <Badge variant="muted">{docsData.total}</Badge>}
        </CardHeader>
        {!docsData?.items.length ? (
          <p className="text-sm text-text-muted">No documents uploaded yet.</p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table columns={docColumns} data={docsData.items} rowKey={(row) => row.id} />
          </div>
        )}
      </Card>

      {/* Requirements Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Requirements Checklist</CardTitle>
          {reqsData && <Badge variant="muted">{reqsData.total}</Badge>}
        </CardHeader>
        {!reqsData?.items.length ? (
          <p className="text-sm text-text-muted">No document requirements set.</p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table columns={reqColumns} data={reqsData.items} rowKey={(row) => row.id} />
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Placeholder Tab ─────────────────────────────────────────────

function PlaceholderTab({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-surface-sunken flex items-center justify-center mb-3">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-text-muted">
            <rect x="2" y="2" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-text-primary font-display">{title}</h3>
        <p className="text-xs text-text-muted mt-1 max-w-xs">{description}</p>
      </div>
    </Card>
  )
}

function InfoRow({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div>
      <span className="text-xs text-text-muted block mb-0.5">{label}</span>
      <p className={`text-sm text-text-primary ${capitalize ? 'capitalize' : ''}`}>{value}</p>
    </div>
  )
}

function ConsentPill({ label, granted }: { label: string; granted: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
      granted ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${granted ? 'bg-emerald-500' : 'bg-gray-300'}`} />
      {label}
    </span>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
