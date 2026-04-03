'use client'

import { use, useState } from 'react'
import Link from 'next/link'

import type {
  ApplicationListItem,
  DocumentListItem,
  DocumentRequirementItem,
} from '@sturec/shared'
import { STAGE_DISPLAY_NAMES, STAGE_ORDER } from '@sturec/shared'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Tabs } from '@/components/ui/tabs'
import { Table, type Column } from '@/components/ui/table'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { StageBadge } from '@/components/shared/stage-badge'
import { ScoreBar } from '@/components/shared/score-bar'
import {
  useStudent,
  useStudentAssessments,
  useStudentTimeline,
  useStudentNotes,
  useCreateNote,
  useStudentActivities,
  useCreateActivity,
  useStudentContacts,
  useCreateContact,
} from '@/features/students/hooks/use-students'
import { useStudentApplications } from '@/features/applications/hooks/use-applications'
import { useStudentDocuments, useStudentRequirements, useVerifyDocument, useRejectDocument } from '@/features/documents/hooks/use-documents'
import { useMeetingOutcomes, useRecordMeetingOutcome, useCreateReminder } from '@/features/counsellor/hooks/use-counsellor'
import { useBookings } from '@/features/bookings/hooks/use-bookings'
import {
  useStudentCampaigns,
  useCampaignPacks,
  useStartCampaign,
  useSendStep,
  useSendAll,
  usePauseCampaign,
  useResumeCampaign,
  useUpdateCampaignMode,
} from '@/features/campaigns/hooks/use-campaigns'

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

      {/* Meeting prep summary */}
      <MeetingPrepBlock studentId={id} student={student} />

      {/* Tabbed content */}
      <Tabs
        items={[
          {
            id: 'overview',
            label: 'Overview',
            content: <OverviewTab student={student} />,
          },
          {
            id: 'meetings',
            label: 'Meetings',
            content: <MeetingOutcomesTab studentId={id} />,
          },
          {
            id: 'campaigns',
            label: 'Campaigns',
            content: <CampaignsTab studentId={id} />,
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
            content: <AiAssessmentsTab studentId={id} />,
          },
          {
            id: 'timeline',
            label: 'Timeline',
            content: <TimelineTab studentId={id} />,
          },
          {
            id: 'notes',
            label: 'Notes',
            content: <NotesTab studentId={id} />,
          },
          {
            id: 'contacts',
            label: 'Contacts',
            content: <ContactsTab studentId={id} />,
          },
          {
            id: 'activity',
            label: 'Activity',
            content: <ActivityTab studentId={id} />,
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

  const documents = Array.isArray(docsData)
    ? docsData
    : (docsData?.items ?? [])
  const documentTotal = Array.isArray(docsData)
    ? docsData.length
    : (docsData?.total ?? documents.length)
  const requirements = Array.isArray(reqsData)
    ? reqsData
    : (reqsData?.items ?? [])
  const requirementTotal = Array.isArray(reqsData)
    ? reqsData.length
    : (reqsData?.total ?? requirements.length)

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
          <Badge variant="muted">{documentTotal}</Badge>
        </CardHeader>
        {!documents.length ? (
          <p className="text-sm text-text-muted">No documents uploaded yet.</p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table columns={docColumns} data={documents} rowKey={(row) => row.id} />
          </div>
        )}
      </Card>

      {/* Requirements Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Requirements Checklist</CardTitle>
          <Badge variant="muted">{requirementTotal}</Badge>
        </CardHeader>
        {!requirements.length ? (
          <p className="text-sm text-text-muted">No document requirements set.</p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table columns={reqColumns} data={requirements} rowKey={(row) => row.id} />
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── AI Assessments Tab ──────────────────────────────────────────

function AiAssessmentsTab({ studentId }: { studentId: string }) {
  const { data: assessments, isLoading } = useStudentAssessments(studentId)

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>

  if (!assessments?.length) {
    return (
      <EmptyState
        title="No AI assessments"
        description="No AI assessments have been generated for this student yet."
      />
    )
  }

  return (
    <div className="space-y-4">
      {assessments.map((a) => (
        <Card key={a.id}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Assessment</CardTitle>
              <Badge variant="muted">{a.sourceType}</Badge>
            </div>
            <span className="text-xs text-text-muted font-mono">{formatDate(a.createdAt)}</span>
          </CardHeader>

          {/* Summary */}
          <p className="text-sm text-text-secondary mb-4">{a.summaryForTeam}</p>

          {/* Top-level scores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="space-y-1">
              <span className="text-xs text-text-muted">Overall Readiness</span>
              <ScoreBar label="" value={a.overallReadinessScore} max={100} />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-text-muted">Qualification</span>
              <ScoreBar label="" value={a.qualificationScore} max={100} />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-text-muted">Profile Completeness</span>
              <ScoreBar label="" value={a.profileCompleteness} max={100} />
            </div>
          </div>

          {/* Component scores */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-medium text-text-secondary mb-3">Component Scores</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ScoreBar label="Academic Fit" value={a.academicFitScore} max={100} />
              <ScoreBar label="Financial Readiness" value={a.financialReadinessScore} max={100} />
              <ScoreBar label="Language Readiness" value={a.languageReadinessScore} max={100} />
              <ScoreBar label="Motivation Clarity" value={a.motivationClarityScore} max={100} />
              <ScoreBar label="Timeline Urgency" value={a.timelineUrgencyScore} max={100} />
              <ScoreBar label="Document Readiness" value={a.documentReadinessScore} max={100} />
              <ScoreBar label="Visa Complexity" value={a.visaComplexityScore} max={100} />
            </div>
          </div>

          {/* Extra metadata */}
          <div className="border-t border-border pt-3 mt-4 flex items-center gap-4">
            {a.visaRisk && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-text-muted">Visa Risk:</span>
                <Badge
                  variant={
                    a.visaRisk === 'low' ? 'success' :
                    a.visaRisk === 'medium' ? 'warning' :
                    a.visaRisk === 'high' ? 'danger' : 'muted'
                  }
                  dot
                >
                  {a.visaRisk}
                </Badge>
              </div>
            )}
            {a.priorityLevel && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-text-muted">Priority:</span>
                <Badge variant="muted">{a.priorityLevel}</Badge>
              </div>
            )}
            {a.recommendedDisposition && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-text-muted">Disposition:</span>
                <span className="text-xs text-text-secondary">{a.recommendedDisposition}</span>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}

// ─── Timeline Tab ────────────────────────────────────────────────

function TimelineTab({ studentId }: { studentId: string }) {
  const { data: timeline, isLoading } = useStudentTimeline(studentId)

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>

  if (!timeline?.length) {
    return (
      <EmptyState
        title="No stage transitions"
        description="This student has no recorded stage transitions yet."
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stage Transitions</CardTitle>
      </CardHeader>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-0">
          {timeline.map((t, idx) => (
            <div key={t.id} className="relative flex items-start gap-4 pl-10 py-3">
              {/* Dot on the timeline */}
              <div
                className={`absolute left-[11px] top-4 w-2.5 h-2.5 rounded-full border-2 border-white ${
                  idx === 0 ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {t.fromStage ? (
                    <>
                      <StageBadge stage={t.fromStage} />
                      <span className="text-xs text-text-muted">&rarr;</span>
                    </>
                  ) : null}
                  <StageBadge stage={t.toStage} />
                  <Badge variant="muted">{t.changedByType}</Badge>
                </div>

                {t.reasonNote && (
                  <p className="text-xs text-text-secondary mt-1">{t.reasonNote}</p>
                )}
                {t.reasonCode && !t.reasonNote && (
                  <p className="text-xs text-text-muted mt-1">{t.reasonCode}</p>
                )}

                <p className="text-[11px] text-text-muted mt-1 font-mono">
                  {formatDate(t.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

// ─── Notes Tab ───────────────────────────────────────────────────

function NotesTab({ studentId }: { studentId: string }) {
  const [page, setPage] = useState(1)
  const [content, setContent] = useState('')
  const [noteType, setNoteType] = useState('general')
  const { data, isLoading } = useStudentNotes(studentId, page)
  const createNote = useCreateNote(studentId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    createNote.mutate(
      { noteType, content: content.trim() },
      { onSuccess: () => { setContent(''); setPage(1) } },
    )
  }

  return (
    <div className="space-y-4">
      {/* Create note form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Note</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <div className="w-40">
              <Select
                label="Type"
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
                options={[
                  { value: 'general', label: 'General' },
                  { value: 'counsellor', label: 'Counsellor' },
                  { value: 'academic', label: 'Academic' },
                  { value: 'financial', label: 'Financial' },
                  { value: 'visa', label: 'Visa' },
                  { value: 'follow_up', label: 'Follow-up' },
                ]}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write a note..."
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" loading={createNote.isPending} disabled={!content.trim()}>
              Add Note
            </Button>
          </div>
        </form>
      </Card>

      {/* Notes list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : !data?.items.length ? (
        <EmptyState
          title="No notes"
          description="No notes have been added for this student yet."
        />
      ) : (
        <div className="space-y-3">
          {data.items.map((n) => (
            <Card key={n.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="muted">{n.noteType}</Badge>
                    <span className="text-xs text-text-muted">by {n.createdByName}</span>
                  </div>
                  <p className="text-sm text-text-primary whitespace-pre-wrap">{n.content}</p>
                </div>
                <span className="text-[11px] text-text-muted font-mono shrink-0">
                  {formatDate(n.createdAt)}
                </span>
              </div>
            </Card>
          ))}

          {/* Pagination */}
          {data.total > data.limit && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-text-muted">
                Page {data.page} of {Math.ceil(data.total / data.limit)}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page >= Math.ceil(data.total / data.limit)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Contacts Tab ────────────────────────────────────────────────

function ContactsTab({ studentId }: { studentId: string }) {
  const { data: contacts, isLoading } = useStudentContacts(studentId)
  const createContact = useCreateContact(studentId)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    contactType: 'parent' as string,
    name: '',
    relation: '',
    phone: '',
    email: '',
    isPrimary: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.relation.trim()) return
    createContact.mutate(
      {
        contactType: form.contactType,
        name: form.name.trim(),
        relation: form.relation.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        isPrimary: form.isPrimary,
      },
      {
        onSuccess: () => {
          setForm({ contactType: 'parent', name: '', relation: '', phone: '', email: '', isPrimary: false })
          setShowForm(false)
        },
      },
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with add button */}
      <div className="flex justify-end">
        <Button size="sm" variant="secondary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Contact'}
        </Button>
      </div>

      {/* Create contact form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Contact</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Type"
                value={form.contactType}
                onChange={(e) => setForm({ ...form, contactType: e.target.value })}
                options={[
                  { value: 'parent', label: 'Parent' },
                  { value: 'guardian', label: 'Guardian' },
                  { value: 'emergency', label: 'Emergency' },
                ]}
              />
              <Input
                label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
              />
              <Input
                label="Relation"
                value={form.relation}
                onChange={(e) => setForm({ ...form, relation: e.target.value })}
                placeholder="e.g. Mother, Father, Uncle"
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+33..."
              />
              <Input
                label="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
              />
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPrimary}
                    onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
                    className="rounded border-border"
                  />
                  <span className="text-xs text-text-secondary">Primary contact</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" loading={createContact.isPending} disabled={!form.name.trim() || !form.relation.trim()}>
                Save Contact
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Contacts list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : !contacts?.length ? (
        <EmptyState
          title="No contacts"
          description="No contacts have been added for this student yet."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {contacts.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-text-primary">{c.name}</p>
                    {c.isPrimary && <Badge variant="success">Primary</Badge>}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="muted">{c.contactType}</Badge>
                    <span className="text-xs text-text-muted">{c.relation}</span>
                  </div>
                  {c.phone && (
                    <p className="text-xs text-text-secondary">{c.phone}</p>
                  )}
                  {c.email && (
                    <p className="text-xs text-text-secondary">{c.email}</p>
                  )}
                </div>
                <span className="text-[11px] text-text-muted font-mono shrink-0">
                  {formatDate(c.createdAt)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Activity Tab ────────────────────────────────────────────────

function ActivityTab({ studentId }: { studentId: string }) {
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const { data, isLoading } = useStudentActivities(studentId, page)
  const createActivity = useCreateActivity(studentId)
  const [form, setForm] = useState({
    activityType: 'call' as string,
    channel: 'phone' as string,
    direction: 'outbound' as string,
    outcome: '',
    summary: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createActivity.mutate(
      {
        activityType: form.activityType,
        channel: form.channel,
        direction: form.direction,
        outcome: form.outcome.trim() || undefined,
        summary: form.summary.trim() || undefined,
      },
      {
        onSuccess: () => {
          setForm({ activityType: 'call', channel: 'phone', direction: 'outbound', outcome: '', summary: '' })
          setShowForm(false)
          setPage(1)
        },
      },
    )
  }

  const activityTypeOptions = [
    { value: 'call', label: 'Call' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'email', label: 'Email' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'status_update', label: 'Status Update' },
    { value: 'other', label: 'Other' },
  ]

  const channelOptions = [
    { value: 'phone', label: 'Phone' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'email', label: 'Email' },
    { value: 'video', label: 'Video' },
    { value: 'in_person', label: 'In Person' },
    { value: 'internal', label: 'Internal' },
    { value: 'other', label: 'Other' },
  ]

  const directionOptions = [
    { value: 'outbound', label: 'Outbound' },
    { value: 'inbound', label: 'Inbound' },
    { value: 'internal', label: 'Internal' },
  ]

  return (
    <div className="space-y-4">
      {/* Header with add button */}
      <div className="flex justify-end">
        <Button size="sm" variant="secondary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Log Activity'}
        </Button>
      </div>

      {/* Create activity form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Log Activity</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Type"
                value={form.activityType}
                onChange={(e) => setForm({ ...form, activityType: e.target.value })}
                options={activityTypeOptions}
              />
              <Select
                label="Channel"
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
                options={channelOptions}
              />
              <Select
                label="Direction"
                value={form.direction}
                onChange={(e) => setForm({ ...form, direction: e.target.value })}
                options={directionOptions}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Outcome"
                value={form.outcome}
                onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                placeholder="e.g. Scheduled follow-up, Left voicemail"
              />
              <Input
                label="Summary"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="Brief summary of the interaction"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" loading={createActivity.isPending}>
                Log Activity
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Activities list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : !data?.items.length ? (
        <EmptyState
          title="No activities"
          description="No activities have been logged for this student yet."
        />
      ) : (
        <div className="space-y-3">
          {data.items.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant="info">{a.activityType.replace(/_/g, ' ')}</Badge>
                    <Badge variant="muted">{a.channel.replace(/_/g, ' ')}</Badge>
                    <Badge
                      variant={a.direction === 'outbound' ? 'success' : a.direction === 'inbound' ? 'warning' : 'muted'}
                    >
                      {a.direction}
                    </Badge>
                  </div>
                  {a.summary && (
                    <p className="text-sm text-text-primary mt-1">{a.summary}</p>
                  )}
                  {a.outcome && (
                    <p className="text-xs text-text-secondary mt-1">Outcome: {a.outcome}</p>
                  )}
                  <p className="text-[11px] text-text-muted mt-1">by {a.createdBy.name}</p>
                </div>
                <span className="text-[11px] text-text-muted font-mono shrink-0">
                  {formatDate(a.createdAt)}
                </span>
              </div>
            </Card>
          ))}

          {/* Pagination */}
          {data.total > data.limit && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-text-muted">
                Page {data.page} of {Math.ceil(data.total / data.limit)}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page >= Math.ceil(data.total / data.limit)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
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

// ─── Meeting Prep Block ─────────────────────────────────────

function MeetingPrepBlock({ studentId, student }: { studentId: string; student: ReturnType<typeof useStudent>['data'] }) {
  const { data: assessments } = useStudentAssessments(studentId)
  const latestAssessment = assessments?.[0]
  const summaryForTeam = latestAssessment?.summaryForTeam?.trim()
  const summaryFallback = 'No AI intake summary available yet. Use the student profile, booking notes, and the first consultation to complete intake.'

  if (!student) return null

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Meeting Prep</CardTitle>
        <StageBadge stage={student.stage} />
      </CardHeader>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Lead Heat</p>
          <Badge variant={
            latestAssessment?.leadHeat === 'hot' ? 'danger' :
            latestAssessment?.leadHeat === 'warm' ? 'warning' :
            latestAssessment?.leadHeat === 'cold' ? 'info' :
            latestAssessment?.leadHeat === 'needs_follow_up' ? 'warning' : 'muted'
          } dot>
            {latestAssessment?.leadHeat ?? 'Not assessed'}
          </Badge>
        </div>
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Counsellor</p>
          <p className="text-sm text-text-primary">{student.assignedCounsellorId ? 'Assigned' : 'Unassigned'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Profile</p>
          <p className="text-sm text-text-primary">
            {latestAssessment?.profileCompleteness
              ? `${Math.round(Number(latestAssessment.profileCompleteness) * 100)}% complete`
              : 'No data'}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Visa Risk</p>
          <Badge variant={
            student.visaRisk === 'low' ? 'success' :
            student.visaRisk === 'medium' ? 'warning' :
            student.visaRisk === 'high' ? 'danger' : 'muted'
          } dot>
            {student.visaRisk ?? 'Unknown'}
          </Badge>
        </div>
      </div>
      <div className="mt-4 border-t border-border pt-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">AI Summary</p>
        <p className="text-sm leading-7 text-text-secondary">{summaryForTeam || summaryFallback}</p>
      </div>
    </Card>
  )
}

// ─── Meeting Outcomes Tab ───────────────────────────────────

function MeetingOutcomesTab({ studentId }: { studentId: string }) {
  const { data: outcomes, isLoading } = useMeetingOutcomes(studentId)
  const { data: bookings } = useBookings()
  const recordOutcome = useRecordMeetingOutcome()
  const createReminder = useCreateReminder()
  const [showForm, setShowForm] = useState(false)
  const [showReminderForm, setShowReminderForm] = useState(false)
  const [form, setForm] = useState({
    bookingId: '',
    outcome: '',
    nextAction: '',
    followUpDueAt: '',
    privateNote: '',
    studentVisibleNote: '',
    stageAfter: '',
  })
  const [reminderForm, setReminderForm] = useState({ title: '', dueAt: '' })

  // Filter bookings for this student (completed or assigned)
  const studentBookings = (bookings ?? []).filter(
    (b) => b.studentId === studentId && ['assigned', 'scheduled', 'completed'].includes(b.status),
  )

  if (isLoading) return <LoadingSpinner size="md" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Meeting Outcomes</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowReminderForm(!showReminderForm)}>
            {showReminderForm ? 'Cancel' : 'Add reminder'}
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Record outcome'}
          </Button>
        </div>
      </div>

      {showReminderForm && (
        <Card>
          <CardHeader><CardTitle>Create follow-up reminder</CardTitle></CardHeader>
          <div className="space-y-4">
            <Input
              label="Reminder"
              value={reminderForm.title}
              onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
              placeholder="e.g., Follow up about transcripts"
            />
            <Input
              label="Due date"
              type="date"
              value={reminderForm.dueAt}
              onChange={(e) => setReminderForm({ ...reminderForm, dueAt: e.target.value })}
            />
            <Button
              size="sm"
              loading={createReminder.isPending}
              disabled={!reminderForm.title || !reminderForm.dueAt}
              onClick={() => {
                createReminder.mutate({
                  studentId,
                  title: reminderForm.title,
                  dueAt: new Date(reminderForm.dueAt).toISOString(),
                }, {
                  onSuccess: () => {
                    setShowReminderForm(false)
                    setReminderForm({ title: '', dueAt: '' })
                  },
                })
              }}
            >
              Create reminder
            </Button>
          </div>
        </Card>
      )}

      {showForm && (
        <Card>
          <div className="space-y-4">
            <Select
              label="Meeting"
              options={[
                { value: '', label: 'Select a booking...' },
                ...studentBookings.map((b) => ({
                  value: b.id,
                  label: `${new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} — ${b.status}`,
                })),
              ]}
              value={form.bookingId}
              onChange={(e) => setForm({ ...form, bookingId: e.target.value })}
            />
            <Select
              label="Outcome"
              options={[
                { value: 'qualified', label: 'Qualified' },
                { value: 'needs_follow_up', label: 'Needs follow-up' },
                { value: 'not_ready', label: 'Not ready' },
                { value: 'disqualified', label: 'Disqualified' },
              ]}
              value={form.outcome}
              onChange={(e) => setForm({ ...form, outcome: e.target.value })}
            />
            <Input
              label="Next action"
              value={form.nextAction}
              onChange={(e) => setForm({ ...form, nextAction: e.target.value })}
              placeholder="What needs to happen next?"
            />
            <Input
              label="Follow-up due date"
              type="date"
              value={form.followUpDueAt}
              onChange={(e) => setForm({ ...form, followUpDueAt: e.target.value })}
            />
            <Input
              label="Private note (counsellor + admin only)"
              value={form.privateNote}
              onChange={(e) => setForm({ ...form, privateNote: e.target.value })}
              placeholder="Internal notes..."
            />
            <Input
              label="Student-visible note (optional)"
              value={form.studentVisibleNote}
              onChange={(e) => setForm({ ...form, studentVisibleNote: e.target.value })}
              placeholder="Visible to the student as their next step"
            />
            <Select
              label="Update stage to (optional)"
              options={[
                { value: '', label: 'No change' },
                ...STAGE_ORDER.map((s) => ({ value: s, label: STAGE_DISPLAY_NAMES[s] })),
              ]}
              value={form.stageAfter}
              onChange={(e) => setForm({ ...form, stageAfter: e.target.value })}
            />
            <Button
              loading={recordOutcome.isPending}
              disabled={!form.bookingId || !form.outcome || !form.nextAction}
              onClick={() => {
                recordOutcome.mutate({
                  studentId,
                  bookingId: form.bookingId,
                  outcome: form.outcome,
                  nextAction: form.nextAction,
                  followUpDueAt: form.followUpDueAt || undefined,
                  privateNote: form.privateNote || undefined,
                  studentVisibleNote: form.studentVisibleNote || undefined,
                  stageAfter: form.stageAfter || undefined,
                }, {
                  onSuccess: () => {
                    setShowForm(false)
                    setForm({ bookingId: '', outcome: '', nextAction: '', followUpDueAt: '', privateNote: '', studentVisibleNote: '', stageAfter: '' })
                  },
                })
              }}
            >
              Save outcome
            </Button>
          </div>
        </Card>
      )}

      {(outcomes ?? []).length === 0 && !showForm ? (
        <EmptyState title="No meeting outcomes recorded yet." />
      ) : (
        <div className="space-y-4">
          {(outcomes ?? []).map((o) => (
            <Card key={o.id}>
              <div className="flex items-center justify-between mb-3">
                <Badge variant={
                  o.outcome === 'qualified' ? 'success' :
                  o.outcome === 'needs_follow_up' ? 'warning' :
                  o.outcome === 'not_ready' ? 'info' :
                  'danger'
                } dot>
                  {o.outcome.replace(/_/g, ' ')}
                </Badge>
                <span className="text-xs text-text-muted">{formatDate(o.createdAt)}</span>
              </div>
              <p className="text-sm font-semibold text-text-primary mb-1">Next action</p>
              <p className="text-sm text-text-secondary mb-3">{o.nextAction}</p>
              {o.followUpDueAt && (
                <p className="text-xs text-text-muted mb-2">Follow-up due: {formatDate(o.followUpDueAt)}</p>
              )}
              {o.privateNote && (
                <div className="rounded-lg bg-surface-sunken/50 p-3 mb-2">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Private note</p>
                  <p className="text-sm text-text-secondary">{o.privateNote}</p>
                </div>
              )}
              {o.studentVisibleNote && (
                <div className="rounded-lg bg-primary-50 p-3">
                  <p className="text-xs font-semibold text-primary-700 uppercase tracking-wider mb-1">Student-visible</p>
                  <p className="text-sm text-text-secondary">{o.studentVisibleNote}</p>
                </div>
              )}
              {o.stageAfter && (
                <p className="text-xs text-text-muted mt-2">Stage changed to: {STAGE_DISPLAY_NAMES[o.stageAfter as keyof typeof STAGE_DISPLAY_NAMES] ?? o.stageAfter}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Campaigns Tab ──────────────────────────────────────────

function CampaignsTab({ studentId }: { studentId: string }) {
  const { data: campaigns, isLoading } = useStudentCampaigns(studentId)
  const { data: packs } = useCampaignPacks()
  const startCampaign = useStartCampaign()
  const sendStep = useSendStep()
  const sendAll = useSendAll()
  const pauseCampaign = usePauseCampaign()
  const resumeCampaign = useResumeCampaign()
  const updateMode = useUpdateCampaignMode()
  const [selectedPack, setSelectedPack] = useState('')

  if (isLoading) return <LoadingSpinner size="md" />

  const channelBadge = (channel: string) => {
    const variant = channel === 'email' ? 'info' : channel === 'whatsapp' ? 'success' : 'muted'
    return <Badge variant={variant as any}>{channel}</Badge>
  }

  const stepStatusBadge = (status: string) => {
    const variant = status === 'sent' ? 'success' : status === 'failed' ? 'danger' : status === 'scheduled' ? 'info' : 'muted'
    return <Badge variant={variant as any} dot>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Start a new campaign */}
      <Card>
        <CardHeader><CardTitle>Start a campaign pack</CardTitle></CardHeader>
        <div className="flex gap-3">
          <Select
            options={[
              { value: '', label: 'Select a pack...' },
              ...(packs ?? []).map((p) => ({
                value: p.id,
                label: `${p.name} (${p.phaseKey}) — ${p.steps.length} steps`,
              })),
            ]}
            value={selectedPack}
            onChange={(e) => setSelectedPack(e.target.value)}
          />
          <Button
            size="sm"
            disabled={!selectedPack || startCampaign.isPending}
            loading={startCampaign.isPending}
            onClick={() => {
              startCampaign.mutate({ studentId, packId: selectedPack }, {
                onSuccess: () => setSelectedPack(''),
              })
            }}
          >
            Start
          </Button>
        </div>
      </Card>

      {/* Active campaigns */}
      {(campaigns ?? []).length === 0 ? (
        <EmptyState title="No campaigns started yet." description="Select a pack above to begin." />
      ) : (
        (campaigns ?? []).map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader>
              <div>
                <CardTitle>{campaign.pack.name}</CardTitle>
                <p className="text-xs text-text-muted mt-1">{campaign.phaseKey} — {campaign.mode}</p>
              </div>
              <Badge variant={
                campaign.status === 'active' ? 'success' :
                campaign.status === 'paused' ? 'warning' :
                campaign.status === 'completed' ? 'primary' : 'muted'
              } dot>
                {campaign.status}
              </Badge>
            </CardHeader>

            <div className="flex flex-wrap gap-2 mb-4">
              {campaign.status === 'active' && (
                <>
                  <Button size="sm" variant="secondary"
                    onClick={() => sendAll.mutate({ studentId, campaignId: campaign.id })}
                    loading={sendAll.isPending}
                  >
                    Send all due
                  </Button>
                  <Button size="sm" variant="secondary"
                    onClick={() => pauseCampaign.mutate({ studentId, campaignId: campaign.id })}
                  >
                    Pause
                  </Button>
                  <Button size="sm" variant="ghost"
                    onClick={() => updateMode.mutate({
                      studentId,
                      campaignId: campaign.id,
                      mode: campaign.mode === 'manual' ? 'automated' : 'manual',
                    })}
                  >
                    {campaign.mode === 'manual' ? 'Enable auto' : 'Switch to manual'}
                  </Button>
                </>
              )}
              {campaign.status === 'paused' && (
                <Button size="sm" variant="secondary"
                  onClick={() => resumeCampaign.mutate({ studentId, campaignId: campaign.id })}
                >
                  Resume
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {campaign.steps.map((step) => (
                <div key={step.id} className="flex items-center justify-between rounded-lg bg-surface-sunken/50 p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-text-muted w-6">{step.orderIndex + 1}</span>
                    {channelBadge(step.template.channel)}
                    <span className="text-sm text-text-primary">{step.template.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {step.sentAt && (
                      <span className="text-xs text-text-muted">
                        {new Date(step.sentAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                    )}
                    {stepStatusBadge(step.status)}
                    {(step.status === 'pending' || step.status === 'scheduled') && campaign.status === 'active' && (
                      <Button size="sm" variant="ghost"
                        onClick={() => sendStep.mutate({ studentId, campaignId: campaign.id, stepId: step.id })}
                        disabled={sendStep.isPending}
                      >
                        Send
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
