'use client'

import { use, useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

import type {
  ApplicationListItem,
  DocumentListItem,
  DocumentRequirementItem,
  PaginatedResponse,
} from '@sturec/shared'
import { STAGE_DISPLAY_NAMES, STAGE_ORDER } from '@sturec/shared'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { Tabs } from '@/components/ui/tabs'
import { Table, type Column } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { StageBadge } from '@/components/shared/stage-badge'
import { ScoreBar } from '@/components/shared/score-bar'
import { useAuth } from '@/providers/auth-provider'
import {
  useStudent,
  useStudentAssessments,
  useStudentTimeline,
  useStudentCaseLog,
  useStudentNotes,
  useChangeStudentStage,
  useCreateNote,
  useStudentActivities,
  useCreateActivity,
  useStudentContacts,
  useCreateContact,
  useAssignStudentCounsellor,
} from '@/features/students/hooks/use-students'
import { useStudentApplications } from '@/features/applications/hooks/use-applications'
import { useStudentDocuments, useStudentRequirements, useVerifyDocument, useRejectDocument } from '@/features/documents/hooks/use-documents'
import { useMeetingOutcomes, useRecordMeetingOutcome, useCreateReminder, useCounsellorReminders } from '@/features/counsellor/hooks/use-counsellor'
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
  useCampaignHistory,
} from '@/features/campaigns/hooks/use-campaigns'
import { fetchTeamMembers } from '@/features/team/lib/team-cache'

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const { data: student, isLoading, error } = useStudent(id)
  const changeStage = useChangeStudentStage(id)
  const assignCounsellor = useAssignStudentCounsellor(id)
  const [showStageModal, setShowStageModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [activeTab, setActiveTab] = useState('work')
  const [meetingIntent, setMeetingIntent] = useState<'outcome' | 'reminder' | null>(null)
  const [stageForm, setStageForm] = useState({
    toStage: '',
    reasonCode: 'manual_review',
    reasonNote: '',
  })
  const [assignForm, setAssignForm] = useState({
    counsellorId: '',
    reason: '',
  })

  const isAdmin = user?.role === 'admin'
  const teamQuery = useQuery({
    queryKey: ['team', 'invite-and-assignment-options'],
    queryFn: fetchTeamMembers,
    enabled: showAssignModal && isAdmin,
    staleTime: 60_000,
  })

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
  const availableCounsellors = (teamQuery.data ?? []).filter((member) => member.role === 'counsellor' && member.status !== 'deactivated')
  const openOutcomeFlow = () => {
    setActiveTab('work')
    setMeetingIntent('outcome')
  }
  const openReminderFlow = () => {
    setActiveTab('work')
    setMeetingIntent('reminder')
  }
  const openHistoryFlow = () => setActiveTab('history')

  return (
    <div className="min-w-0 overflow-x-hidden">
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
        description="Use this page to assess current progress, understand what happened last, and decide the next internal action."
        badge={
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
              {student.referenceCode}
            </span>
            <StageBadge stage={student.stage} />
          </div>
        }
        actions={
          <div className="flex w-full flex-wrap gap-2 lg:max-w-[42rem] lg:justify-end">
            <Button size="sm" variant="ghost" onClick={openOutcomeFlow}>
              Record Outcome
            </Button>
            <Button size="sm" variant="ghost" onClick={openReminderFlow}>
              Add Reminder
            </Button>
            <Button size="sm" variant="ghost" onClick={openHistoryFlow}>
              View History
            </Button>
            <Button size="sm" variant="secondary" onClick={() => {
              setStageForm({
                toStage: student.stage,
                reasonCode: 'manual_review',
                reasonNote: '',
              })
              setShowStageModal(true)
            }}>
              Change Stage
            </Button>
            {isAdmin ? (
              <Button size="sm" variant="secondary" onClick={() => {
                setAssignForm({
                  counsellorId: student.assignedCounsellorId ?? '',
                  reason: '',
                })
                setShowAssignModal(true)
              }}>
                {student.assignedCounsellorId ? 'Reassign Counsellor' : 'Assign Counsellor'}
              </Button>
            ) : null}
          </div>
        }
      />

      {/* Stage pipeline */}
      <Card className="mb-6 min-w-0" padding="sm">
        <div className="flex items-center gap-0.5 overflow-x-auto py-1 px-1">
          {STAGE_ORDER.map((s, idx) => {
            const isCurrent = s === student.stage
            const isPast = idx < stageIndex
            return (
              <div
                key={s}
                className={`
                  shrink-0 min-w-[5.5rem] px-2 py-1.5 rounded-md text-center text-[10px] font-medium truncate
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

      <OperationalSummaryBlock studentId={id} student={student} />
      <MeetingPrepBlock studentId={id} student={student} />
      <QuickActionsBlock
        isAdmin={isAdmin}
        onRecordOutcome={openOutcomeFlow}
        onAddReminder={openReminderFlow}
        onViewHistory={openHistoryFlow}
        onChangeStage={() => {
          setStageForm({
            toStage: student.stage,
            reasonCode: 'manual_review',
            reasonNote: '',
          })
          setShowStageModal(true)
        }}
        onReassign={() => {
          setAssignForm({
            counsellorId: student.assignedCounsellorId ?? '',
            reason: '',
          })
          setShowAssignModal(true)
        }}
      />

      {/* Tabbed content */}
      <div className="min-w-0">
        <Tabs
          activeTab={activeTab}
          onChange={(tabId) => {
            setActiveTab(tabId)
            if (tabId !== 'work') setMeetingIntent(null)
          }}
          defaultTab="work"
          items={[
            {
              id: 'work',
              label: 'Work',
              content: <WorkTab studentId={id} intent={meetingIntent} />,
            },
            {
              id: 'history',
              label: 'History',
              content: <HistoryTab studentId={id} />,
            },
            {
              id: 'profile',
              label: 'Profile',
              content: <ProfileWorkspaceTab student={student} studentId={id} />,
            },
          ]}
        />
      </div>

      <Modal
        open={showStageModal}
        onClose={() => setShowStageModal(false)}
        title="Change Stage"
        size="sm"
      >
        <div className="space-y-4">
          <Select
            label="Move student to"
            value={stageForm.toStage}
            onChange={(e) => setStageForm((prev) => ({ ...prev, toStage: e.target.value }))}
            options={STAGE_ORDER.map((stage) => ({
              value: stage,
              label: STAGE_DISPLAY_NAMES[stage],
            }))}
          />
          <Select
            label="Reason"
            value={stageForm.reasonCode}
            onChange={(e) => setStageForm((prev) => ({ ...prev, reasonCode: e.target.value }))}
            options={[
              { value: 'manual_review', label: 'Manual review' },
              { value: 'consultation_complete', label: 'Consultation complete' },
              { value: 'documents_progressed', label: 'Documents progressed' },
              { value: 'campaign_progressed', label: 'Campaign progressed' },
              { value: 'admin_override', label: 'Admin override' },
              { value: 'other', label: 'Other' },
            ]}
          />
          <Textarea
            label="Internal note"
            value={stageForm.reasonNote}
            onChange={(e) => setStageForm((prev) => ({ ...prev, reasonNote: e.target.value }))}
            placeholder="Why are you moving this student, and what should the next owner know?"
          />
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowStageModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              loading={changeStage.isPending}
              disabled={!stageForm.toStage || !stageForm.reasonNote.trim()}
              onClick={() => {
                changeStage.mutate({
                  toStage: stageForm.toStage as typeof STAGE_ORDER[number],
                  reasonCode: stageForm.reasonCode || undefined,
                  reasonNote: stageForm.reasonNote.trim(),
                }, {
                  onSuccess: () => setShowStageModal(false),
                })
              }}
            >
              Save stage change
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Reassign Counsellor"
        size="sm"
      >
        <div className="space-y-4">
          <Select
            label="Counsellor"
            value={assignForm.counsellorId}
            onChange={(e) => setAssignForm((prev) => ({ ...prev, counsellorId: e.target.value }))}
            options={availableCounsellors.map((member) => ({
              value: member.id,
              label: `${member.firstName} ${member.lastName}`,
            }))}
            placeholder="Select counsellor"
          />
          <Textarea
            label="Handoff note"
            value={assignForm.reason}
            onChange={(e) => setAssignForm((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="Why is this case being reassigned, and what should the next counsellor pick up first?"
          />
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              loading={assignCounsellor.isPending}
              disabled={!assignForm.counsellorId || !assignForm.reason.trim()}
              onClick={() => {
                assignCounsellor.mutate({
                  counsellorId: assignForm.counsellorId,
                  reason: assignForm.reason.trim(),
                }, {
                  onSuccess: () => setShowAssignModal(false),
                })
              }}
            >
              Save reassignment
            </Button>
          </div>
        </div>
      </Modal>
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

function getListData<T>(data: PaginatedResponse<T> | T[] | undefined): T[] {
  if (Array.isArray(data)) return data
  return data?.items ?? []
}

function getListMeta<T>(data: PaginatedResponse<T> | T[] | undefined, items: T[]) {
  if (Array.isArray(data)) {
    return {
      total: data.length,
      page: 1,
      limit: data.length || 1,
    }
  }

  return {
    total: data?.total ?? items.length,
    page: data?.page ?? 1,
    limit: data?.limit ?? Math.max(items.length, 1),
  }
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
  const applications = getListData(data)

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

  if (!applications.length) {
    return (
      <EmptyState
        title="No applications"
        description="This student has no applications yet."
      />
    )
  }

  return (
    <div className="bg-surface-raised rounded-xl border border-border overflow-hidden">
      <Table columns={columns} data={applications} rowKey={(row) => row.id} />
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
  const notes = getListData(data)
  const meta = getListMeta(data, notes)

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
                  { value: 'risk', label: 'Risk' },
                  { value: 'academic', label: 'Academic' },
                  { value: 'finance', label: 'Finance' },
                  { value: 'visa', label: 'Visa' },
                  { value: 'meeting_outcome', label: 'Meeting outcome' },
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
      ) : !notes.length ? (
        <EmptyState
          title="No notes"
          description="No notes have been added for this student yet."
        />
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
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
          {meta.total > meta.limit && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-text-muted">
                Page {meta.page} of {Math.ceil(meta.total / meta.limit)}
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
                  disabled={page >= Math.ceil(meta.total / meta.limit)}
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
  const activities = getListData(data)
  const meta = getListMeta(data, activities)
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
      ) : !activities.length ? (
        <EmptyState
          title="No activities"
          description="No activities have been logged for this student yet."
        />
      ) : (
        <div className="space-y-3">
          {activities.map((a) => (
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
                  <p className="text-[11px] text-text-muted mt-1">by {a.createdBy?.name ?? 'Unknown user'}</p>
                </div>
                <span className="text-[11px] text-text-muted font-mono shrink-0">
                  {formatDate(a.createdAt)}
                </span>
              </div>
            </Card>
          ))}

          {/* Pagination */}
          {meta.total > meta.limit && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-text-muted">
                Page {meta.page} of {Math.ceil(meta.total / meta.limit)}
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
                  disabled={page >= Math.ceil(meta.total / meta.limit)}
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

function OperationalSummaryBlock({ studentId, student }: { studentId: string; student: ReturnType<typeof useStudent>['data'] }) {
  const { data: assessments } = useStudentAssessments(studentId)
  const { data: outcomes } = useMeetingOutcomes(studentId)
  const { data: reminders } = useCounsellorReminders()
  const { data: requirements } = useStudentRequirements(studentId)
  const { data: campaigns } = useStudentCampaigns(studentId)
  const latestAssessment = assessments?.[0]
  const latestOutcome = outcomes?.[0]
  const studentReminders = (reminders ?? []).filter((reminder: { student: { id: string } | null; status: string }) => reminder.student?.id === studentId && reminder.status === 'pending')
  const overdueReminder = studentReminders
    .filter((reminder: { dueAt: string }) => new Date(reminder.dueAt).getTime() < Date.now())
    .sort((a: { dueAt: string }, b: { dueAt: string }) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())[0]
  const pendingRequirements = (requirements?.items ?? []).filter((requirement: { status: string }) => ['missing', 'requested', 'rejected'].includes(requirement.status))
  const activeCampaign = (campaigns ?? []).find((campaign) => campaign.status === 'active')
  const activeCampaignName = activeCampaign?.pack?.name ?? 'Campaign pack unavailable'

  if (!student) return null

  const nextAction = (() => {
    if (!student.assignedCounsellorId) {
      return {
        label: 'Assign a counsellor',
        detail: 'This case cannot progress until a counsellor owns it.',
        tone: 'warning' as const,
      }
    }
    if (overdueReminder) {
      return {
        label: overdueReminder.title,
        detail: `Follow-up is overdue since ${formatDate(overdueReminder.dueAt)}.`,
        tone: 'danger' as const,
      }
    }
    if (pendingRequirements.length > 0) {
      return {
        label: `Review ${pendingRequirements.length} document requirement${pendingRequirements.length === 1 ? '' : 's'}`,
        detail: 'The document checklist still has open items blocking progress.',
        tone: 'warning' as const,
      }
    }
    if (latestOutcome?.nextAction) {
      return {
        label: latestOutcome.nextAction,
        detail: latestOutcome.followUpDueAt
          ? `Follow-up planned for ${formatDate(latestOutcome.followUpDueAt)}.`
          : 'This came from the latest recorded meeting outcome.',
        tone: 'info' as const,
      }
    }
    if (!activeCampaign) {
      return {
        label: 'Start the phase campaign',
        detail: 'No active campaign is running for this student yet.',
        tone: 'info' as const,
      }
    }
    return {
      label: 'Continue active case management',
      detail: 'No urgent blocker is recorded right now.',
      tone: 'success' as const,
    }
  })()

  return (
    <Card className="mb-6">
      <CardHeader>
        <div>
          <CardTitle>Operational Summary</CardTitle>
          <p className="mt-1 text-xs text-text-muted">This is the internal working summary for counsellors and admins.</p>
        </div>
        <Badge variant={
          nextAction.tone === 'danger' ? 'danger' :
          nextAction.tone === 'warning' ? 'warning' :
          nextAction.tone === 'success' ? 'success' : 'info'
        } dot>
          Next: {nextAction.tone === 'danger' ? 'urgent' : nextAction.tone}
        </Badge>
      </CardHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric
          label="Current Stage"
          value={STAGE_DISPLAY_NAMES[student.stage]}
          hint={`Updated ${formatDate(student.stageUpdatedAt)}`}
        />
        <SummaryMetric
          label="Owner"
          value={student.counsellorName}
          hint={student.assignedAt ? `Assigned ${formatDate(student.assignedAt)}` : 'Needs ownership'}
        />
        <SummaryMetric
          label="Lead Heat"
          value={latestAssessment?.leadHeat ? latestAssessment.leadHeat.replace(/_/g, ' ') : 'Not assessed'}
          hint={latestAssessment ? `AI updated ${formatDate(latestAssessment.createdAt)}` : 'No AI assessment yet'}
        />
        <SummaryMetric
          label="Profile Completeness"
          value={latestAssessment?.profileCompleteness != null ? `${Math.round(Number(latestAssessment.profileCompleteness) * 100)}%` : 'No data'}
          hint={pendingRequirements.length > 0 ? `${pendingRequirements.length} open requirement${pendingRequirements.length === 1 ? '' : 's'}` : 'No open document blockers'}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <div className="rounded-2xl border border-border bg-surface-sunken/35 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">What should happen next?</p>
          <p className="mt-2 text-sm font-semibold text-text-primary">{nextAction.label}</p>
          <p className="mt-1 text-sm leading-6 text-text-secondary">{nextAction.detail}</p>
          {latestOutcome?.privateNote ? (
            <div className="mt-3 rounded-xl bg-white/70 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">Latest internal note</p>
              <p className="mt-1 text-sm text-text-secondary">{latestOutcome.privateNote}</p>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-border bg-surface-sunken/35 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Working signals</p>
          <div className="mt-3 space-y-3">
            <SignalRow label="Latest outcome" value={latestOutcome ? latestOutcome.outcome.replace(/_/g, ' ') : 'No meeting recorded'} />
            <SignalRow label="Follow-up due" value={overdueReminder ? formatDate(overdueReminder.dueAt) : studentReminders[0]?.dueAt ? formatDate(studentReminders[0].dueAt) : 'No reminder set'} />
            <SignalRow label="Campaign" value={activeCampaign ? `${activeCampaignName} (${activeCampaign.mode})` : 'No active campaign'} />
            <SignalRow label="Docs to action" value={pendingRequirements.length > 0 ? `${pendingRequirements.length} open` : 'Clear'} />
          </div>
        </div>
      </div>
    </Card>
  )
}

function QuickActionsBlock({
  isAdmin,
  onRecordOutcome,
  onAddReminder,
  onViewHistory,
  onChangeStage,
  onReassign,
}: {
  isAdmin: boolean
  onRecordOutcome: () => void
  onAddReminder: () => void
  onViewHistory: () => void
  onChangeStage: () => void
  onReassign: () => void
}) {
  const actions = [
    {
      title: 'Record outcome',
      description: 'Log what happened in the latest discussion and decide the next case action.',
      cta: 'Record Outcome',
      onClick: onRecordOutcome,
      variant: 'primary' as const,
    },
    {
      title: 'Add reminder',
      description: 'Set a clear due date when something must be followed up and should not slip.',
      cta: 'Add Reminder',
      onClick: onAddReminder,
      variant: 'secondary' as const,
    },
    {
      title: 'Review history',
      description: 'Open the internal trail of notes, outcomes, stage changes, reminders, and assignments.',
      cta: 'Open History',
      onClick: onViewHistory,
      variant: 'secondary' as const,
    },
    {
      title: 'Change stage',
      description: 'Use this when the case has genuinely moved forward or needs reclassification outside a meeting form.',
      cta: 'Change Stage',
      onClick: onChangeStage,
      variant: 'secondary' as const,
    },
  ]

  return (
    <Card className="mb-6">
      <CardHeader>
        <div>
          <CardTitle>Quick Actions</CardTitle>
          <p className="mt-1 text-xs text-text-muted">
            Start here after reading the summary. Pick the one action that moves the case forward right now.
          </p>
        </div>
      </CardHeader>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {actions.map((action) => (
          <div key={action.title} className="rounded-2xl border border-border bg-surface-sunken/30 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">{action.title}</p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{action.description}</p>
              </div>
              <Button size="sm" variant={action.variant} onClick={action.onClick}>
                {action.cta}
              </Button>
            </div>
          </div>
        ))}

        {isAdmin ? (
          <div className="rounded-2xl border border-border bg-primary-50/50 p-4 xl:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">Reassign ownership</p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Admins can reassign this case when workloads change or a counsellor is unavailable. Always add a clear handoff note so the next owner can continue without losing context.
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={onReassign}>
                Reassign Counsellor
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  )
}

function SummaryMetric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-sunken/35 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text-primary">{value}</p>
      <p className="mt-1 text-xs text-text-muted">{hint}</p>
    </div>
  )
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-sm font-medium text-text-primary text-right">{value}</span>
    </div>
  )
}

function WorkflowSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        {description ? <p className="mt-1 text-xs text-text-muted">{description}</p> : null}
      </div>
      {children}
    </div>
  )
}

function WorkTab({ studentId, intent }: { studentId: string; intent?: 'outcome' | 'reminder' | null }) {
  return (
    <div className="space-y-8">
      <WorkflowSection
        title="Meetings"
        description="Record consultation outcomes, decide the next action, and set reminders that keep the case moving."
      >
        <MeetingOutcomesTab studentId={studentId} intent={intent} />
      </WorkflowSection>

      <WorkflowSection
        title="Documents"
        description="Review uploads and requirements here when the student is blocked on missing or pending documents."
      >
        <DocumentsTab studentId={studentId} />
      </WorkflowSection>

      <WorkflowSection
        title="Campaigns"
        description="Use campaigns when the student needs structured outreach, nudges, or a managed follow-up sequence."
      >
        <CampaignsTab studentId={studentId} />
      </WorkflowSection>
    </div>
  )
}

function HistoryTab({ studentId }: { studentId: string }) {
  return (
    <div className="space-y-8">
      <WorkflowSection
        title="Case Log"
        description="This is the internal running trail for decisions, meetings, reminders, assignments, and major activities."
      >
        <CaseLogTab studentId={studentId} />
      </WorkflowSection>

      <WorkflowSection
        title="Notes"
        description="Add private working notes for continuity, blockers, and reassignment context."
      >
        <NotesTab studentId={studentId} />
      </WorkflowSection>

      <WorkflowSection
        title="Activity"
        description="Log outreach and internal actions when they matter to the audit trail."
      >
        <ActivityTab studentId={studentId} />
      </WorkflowSection>
    </div>
  )
}

function ProfileWorkspaceTab({
  student,
  studentId,
}: {
  student: ReturnType<typeof useStudent>['data']
  studentId: string
}) {
  return (
    <div className="space-y-8">
      <WorkflowSection
        title="Profile"
        description="Raw student profile, readiness signals, and ownership details."
      >
        <OverviewTab student={student} />
      </WorkflowSection>

      <WorkflowSection
        title="AI Assessments"
        description="Assessment snapshots and internal scoring details."
      >
        <AiAssessmentsTab studentId={studentId} />
      </WorkflowSection>

      <WorkflowSection
        title="Applications"
        description="Current application pipeline and offer progress."
      >
        <ApplicationsTab studentId={studentId} />
      </WorkflowSection>

      <WorkflowSection
        title="Contacts"
        description="Emergency and family contacts linked to this student."
      >
        <ContactsTab studentId={studentId} />
      </WorkflowSection>

      <WorkflowSection
        title="Stage History"
        description="Formal stage movements and the reasons recorded for them."
      >
        <TimelineTab studentId={studentId} />
      </WorkflowSection>
    </div>
  )
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

function MeetingOutcomesTab({ studentId, intent }: { studentId: string; intent?: 'outcome' | 'reminder' | null }) {
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
    stageAfter: '',
  })
  const [reminderForm, setReminderForm] = useState({ title: '', dueAt: '' })

  useEffect(() => {
    if (intent === 'outcome') {
      setShowForm(true)
      setShowReminderForm(false)
    } else if (intent === 'reminder') {
      setShowReminderForm(true)
      setShowForm(false)
    }
  }, [intent])

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
                  stageAfter: form.stageAfter || undefined,
                }, {
                  onSuccess: () => {
                    setShowForm(false)
                    setForm({ bookingId: '', outcome: '', nextAction: '', followUpDueAt: '', privateNote: '', stageAfter: '' })
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

function CaseLogTab({ studentId }: { studentId: string }) {
  const { data: entries, isLoading } = useStudentCaseLog(studentId)

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>

  if (!entries?.length) {
    return (
      <EmptyState
        title="No case activity yet"
        description="Notes, stage changes, reminders, assignments, and meeting outcomes will appear here in one internal trail."
      />
    )
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <Card key={`${entry.kind}-${entry.id}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant={caseLogBadgeVariant(entry.kind)}>{entry.kind.replace(/_/g, ' ')}</Badge>
                {entry.status && <Badge variant="muted">{entry.status.replace(/_/g, ' ')}</Badge>}
                {entry.actorName && <span className="text-xs text-text-muted">by {entry.actorName}</span>}
              </div>
              <p className="text-sm font-medium text-text-primary">{entry.title}</p>
              {entry.summary && <p className="text-sm text-text-secondary mt-1">{entry.summary}</p>}
              {entry.detail && <p className="text-sm text-text-secondary mt-1 whitespace-pre-wrap">{entry.detail}</p>}
              {entry.dueAt && (
                <p className="text-xs text-text-muted mt-2">Due: {formatDate(entry.dueAt)}</p>
              )}
            </div>
            <span className="text-[11px] text-text-muted font-mono shrink-0">
              {formatDate(entry.createdAt)}
            </span>
          </div>
        </Card>
      ))}
    </div>
  )
}

function caseLogBadgeVariant(kind: string): 'muted' | 'info' | 'warning' | 'success' | 'danger' | 'primary' {
  switch (kind) {
    case 'meeting_outcome':
      return 'success'
    case 'stage_change':
      return 'primary'
    case 'note':
      return 'muted'
    case 'activity':
      return 'info'
    case 'reminder':
      return 'warning'
    case 'assignment':
      return 'primary'
    default:
      return 'muted'
  }
}

// ─── Campaigns Tab ──────────────────────────────────────────

function CampaignsTab({ studentId }: { studentId: string }) {
  const { data: campaigns, isLoading } = useStudentCampaigns(studentId)
  const { data: packs } = useCampaignPacks()
  const { data: history } = useCampaignHistory(studentId)
  const startCampaign = useStartCampaign()
  const sendStep = useSendStep()
  const sendAll = useSendAll()
  const pauseCampaign = usePauseCampaign()
  const resumeCampaign = useResumeCampaign()
  const updateMode = useUpdateCampaignMode()
  const [selectedPack, setSelectedPack] = useState('')

  if (isLoading) return <LoadingSpinner size="md" />

  const campaignPacks = Array.isArray(packs) ? packs : []
  const studentCampaigns = Array.isArray(campaigns) ? campaigns : []
  const deliveryHistory = Array.isArray(history) ? history : []
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
              ...campaignPacks.map((p) => ({
                value: p.id,
                label: `${p.name} (${p.phaseKey}) — ${(Array.isArray(p.steps) ? p.steps.length : 0)} steps`,
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
      {studentCampaigns.length === 0 ? (
        <EmptyState title="No campaigns started yet." description="Select a pack above to begin." />
      ) : (
        studentCampaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader>
              <div>
                <CardTitle>{campaign.pack?.name ?? 'Campaign pack unavailable'}</CardTitle>
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
              {(Array.isArray(campaign.steps) ? campaign.steps : []).map((step) => (
                <div key={step.id} className="flex items-center justify-between rounded-lg bg-surface-sunken/50 p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-text-muted w-6">{step.orderIndex + 1}</span>
                    {channelBadge(step.template?.channel ?? 'unknown')}
                    <span className="text-sm text-text-primary">{step.template?.name ?? 'Template unavailable'}</span>
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

      {/* Delivery history */}
      {deliveryHistory.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Delivery History</CardTitle></CardHeader>
          <div className="space-y-2">
            {deliveryHistory.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-lg bg-surface-sunken/50 p-3">
                <div className="flex items-center gap-3">
                  <Badge variant={h.channel === 'email' ? 'info' : h.channel === 'whatsapp' ? 'success' : 'muted'}>
                    {h.channel}
                  </Badge>
                  <span className="text-sm text-text-primary">{h.templateName}</span>
                  {h.deliveryMode === 'mautic_campaign_trigger' && (
                    <span className="text-[10px] text-text-muted bg-surface-sunken px-1.5 py-0.5 rounded">Mautic</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {h.sentAt && (
                    <span className="text-xs text-text-muted">
                      {new Date(h.sentAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                  <Badge variant={h.status === 'sent' ? 'success' : h.status === 'failed' ? 'danger' : h.status === 'scheduled' ? 'info' : 'muted'} dot>
                    {h.status}
                  </Badge>
                  {h.errorMessage && (
                    <span className="text-[10px] text-rose-600" title={h.errorMessage}>error</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
