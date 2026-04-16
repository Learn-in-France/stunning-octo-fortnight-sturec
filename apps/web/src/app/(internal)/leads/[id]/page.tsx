'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import type { LeadQualificationBlock } from '@sturec/shared'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { PriorityBadge } from '@/components/shared/priority-badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { ScoreBar, ScoreCircle } from '@/components/shared/score-bar'
import { useToast } from '@/providers/toast-provider'
import {
  useLead,
  useConvertLead,
  useDisqualifyLead,
  useCreateLeadActivity,
  type LeadDetailView,
} from '@/features/leads/hooks/use-leads'
import type { TimelineItem } from '@/features/leads/hooks/use-leads'

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { addToast } = useToast()
  const { data: lead, isLoading, error } = useLead(id)

  const convertLead = useConvertLead(id)
  const disqualifyLead = useDisqualifyLead(id)
  const createActivity = useCreateLeadActivity(id)

  const [showDisqualifyModal, setShowDisqualifyModal] = useState(false)
  const [disqualifyReason, setDisqualifyReason] = useState('')
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [activityForm, setActivityForm] = useState({
    activityType: 'call' as string,
    channel: 'phone' as string,
    direction: 'outbound' as string,
    outcome: '',
    summary: '',
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !lead) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted">{error ? 'Failed to load lead details.' : 'Lead not found.'}</p>
        <Link href="/leads" className="text-sm text-primary-600 hover:underline mt-2 inline-block">
          Back to leads
        </Link>
      </div>
    )
  }

  const qualification = lead.qualification
  const assessment = lead.latestAssessment
  const isActionable = lead.status !== 'converted' && lead.status !== 'disqualified'

  function handleConvert() {
    convertLead.mutate(undefined, {
      onSuccess: (data: unknown) => {
        const result = data as { studentId?: string } | undefined
        addToast('success', 'Lead converted to student.')
        if (result?.studentId) {
          router.push(`/students/${result.studentId}`)
        } else {
          router.push('/students')
        }
      },
      onError: () => addToast('error', 'Failed to convert lead.'),
    })
  }

  function handleDisqualify(e: React.FormEvent) {
    e.preventDefault()
    if (!disqualifyReason.trim()) return
    disqualifyLead.mutate(disqualifyReason.trim(), {
      onSuccess: () => {
        addToast('success', 'Lead disqualified.')
        setShowDisqualifyModal(false)
        setDisqualifyReason('')
      },
      onError: () => addToast('error', 'Failed to disqualify lead.'),
    })
  }

  function handleLogActivity(e: React.FormEvent) {
    e.preventDefault()
    createActivity.mutate(
      {
        activityType: activityForm.activityType,
        channel: activityForm.channel,
        direction: activityForm.direction,
        outcome: activityForm.outcome.trim() || undefined,
        summary: activityForm.summary.trim() || undefined,
      },
      {
        onSuccess: () => {
          addToast('success', 'Activity logged.')
          setActivityForm({ activityType: 'call', channel: 'phone', direction: 'outbound', outcome: '', summary: '' })
          setShowActivityForm(false)
        },
        onError: () => addToast('error', 'Failed to log activity.'),
      },
    )
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-text-muted mb-4">
        <Link href="/leads" className="hover:text-primary-600 transition-colors">
          Leads
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{lead.firstName} {lead.lastName}</span>
      </div>

      <PageHeader
        title={`${lead.firstName} ${lead.lastName ?? ''}`}
        badge={
          <div className="flex items-center gap-2">
            <StatusBadge status={lead.status} />
            {lead.isPartnerHotLead && <Badge variant="warning">Hot partner lead</Badge>}
            {lead.needsIntakeCompletion && <Badge variant="muted">Needs intake completion</Badge>}
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            {isActionable && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowActivityForm(!showActivityForm)}
                >
                  {showActivityForm ? 'Cancel' : 'Log Activity'}
                </Button>
                {(lead.status === 'qualified' || lead.status === 'nurturing') && (
                  <Button
                    size="sm"
                    onClick={handleConvert}
                    loading={convertLead.isPending}
                  >
                    Convert to Student
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setShowDisqualifyModal(true)}
                >
                  Disqualify
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Activity logging form */}
      {showActivityForm && isActionable && (
        <Card>
          <CardHeader>
            <CardTitle>Log Activity</CardTitle>
          </CardHeader>
          <form onSubmit={handleLogActivity} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Type"
                value={activityForm.activityType}
                onChange={(e) => setActivityForm({ ...activityForm, activityType: e.target.value })}
                options={[
                  { value: 'call', label: 'Call' },
                  { value: 'whatsapp', label: 'WhatsApp' },
                  { value: 'email', label: 'Email' },
                  { value: 'meeting', label: 'Meeting' },
                  { value: 'follow_up', label: 'Follow-up' },
                  { value: 'status_update', label: 'Status Update' },
                  { value: 'other', label: 'Other' },
                ]}
              />
              <Select
                label="Channel"
                value={activityForm.channel}
                onChange={(e) => setActivityForm({ ...activityForm, channel: e.target.value })}
                options={[
                  { value: 'phone', label: 'Phone' },
                  { value: 'whatsapp', label: 'WhatsApp' },
                  { value: 'email', label: 'Email' },
                  { value: 'video', label: 'Video' },
                  { value: 'in_person', label: 'In Person' },
                  { value: 'internal', label: 'Internal' },
                  { value: 'other', label: 'Other' },
                ]}
              />
              <Select
                label="Direction"
                value={activityForm.direction}
                onChange={(e) => setActivityForm({ ...activityForm, direction: e.target.value })}
                options={[
                  { value: 'outbound', label: 'Outbound' },
                  { value: 'inbound', label: 'Inbound' },
                  { value: 'internal', label: 'Internal' },
                ]}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Outcome"
                value={activityForm.outcome}
                onChange={(e) => setActivityForm({ ...activityForm, outcome: e.target.value })}
                placeholder="e.g. Interested, No answer, Callback requested"
              />
              <Input
                label="Summary"
                value={activityForm.summary}
                onChange={(e) => setActivityForm({ ...activityForm, summary: e.target.value })}
                placeholder="Brief summary of the interaction"
              />
            </div>
            <div className="flex justify-end">
              <Button size="sm" type="submit" loading={createActivity.isPending}>
                Save Activity
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left column — profile + qualification */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile card */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Profile</CardTitle>
              <PriorityBadge priority={lead.priorityLevel} />
            </CardHeader>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Email" value={lead.email} />
              <InfoRow label="Phone" value={lead.phone ?? '—'} />
              <InfoRow label="Source" value={lead.source} capitalize />
              <InfoRow label="Source Partner" value={lead.sourcePartner ?? '—'} />
              <InfoRow label="Counsellor" value={lead.counsellorName} />
              <InfoRow label="Created" value={formatDateTime(lead.createdAt)} />
              {lead.isPartnerHotLead && (
                <div className="col-span-2">
                  <span className="text-xs text-text-muted block mb-1">Workflow</span>
                  <p className="text-sm text-text-secondary">
                    Trusted university-partner lead. Prioritize outreach quickly even if the intake is still incomplete.
                  </p>
                </div>
              )}
              {lead.needsIntakeCompletion && (
                <div className="col-span-2">
                  <span className="text-xs text-text-muted block mb-1">Next action</span>
                  <p className="text-sm text-text-secondary">
                    Use the first counsellor interaction to collect the missing academic, budget, language, and timeline details.
                  </p>
                </div>
              )}
              {lead.notes && (
                <div className="col-span-2">
                  <span className="text-xs text-text-muted block mb-1">Notes</span>
                  <p className="text-sm text-text-secondary">{lead.notes}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Qualification block */}
          {qualification && (
            <QualificationCard qualification={qualification} assessment={assessment} />
          )}

          {/* AI Summary */}
          {qualification?.summaryForTeam && (
            <Card>
              <CardHeader>
                <CardTitle>AI Snapshot</CardTitle>
                {assessment && (
                  <Badge variant="info">
                    {assessment.sourceType === 'chat' ? 'From Chat' : 'From Import'}
                  </Badge>
                )}
              </CardHeader>
              <p className="text-sm text-text-secondary leading-relaxed">
                {qualification.summaryForTeam}
              </p>
            </Card>
          )}
        </div>

        {/* Right column — timeline */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            {lead.timeline.length === 0 ? (
              <p className="text-sm text-text-muted">No activity yet. Use "Log Activity" above to record your first outreach.</p>
            ) : (
              <div className="space-y-0">
                {lead.timeline
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((item, idx) => (
                    <TimelineEntry key={item.id} item={item} isLast={idx === lead.timeline.length - 1} />
                  ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Disqualify modal */}
      <Modal open={showDisqualifyModal} onClose={() => setShowDisqualifyModal(false)} title="Disqualify Lead" size="sm">
        <form onSubmit={handleDisqualify} className="space-y-4">
          <p className="text-sm text-text-secondary">
            This marks <strong>{lead.firstName} {lead.lastName}</strong> as disqualified. Add a reason so the team knows why.
          </p>
          <Textarea
            label="Reason"
            value={disqualifyReason}
            onChange={(e) => setDisqualifyReason(e.target.value)}
            placeholder="e.g. Not eligible for France programs, budget too low, not responsive after 3 attempts"
            className="min-h-[100px]"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowDisqualifyModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" size="sm" loading={disqualifyLead.isPending} disabled={!disqualifyReason.trim()}>
              Disqualify
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function QualificationCard({
  qualification,
  assessment,
}: {
  qualification: LeadQualificationBlock
  assessment: LeadDetailView['latestAssessment']
}) {
  const scores = qualification.componentScores

  return (
    <Card>
      <CardHeader>
        <CardTitle>Qualification Assessment</CardTitle>
      </CardHeader>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        {/* Overall score circle */}
        <div className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-surface-sunken/50">
          <ScoreCircle value={qualification.qualificationScore} size={72} />
          <div className="text-center">
            <p className="text-xs font-semibold text-text-primary">Qualification Score</p>
            <p className="text-[10px] text-text-muted">out of 100</p>
          </div>
          <PriorityBadge priority={qualification.priorityLevel} />
        </div>

        {/* Component scores */}
        {scores && (
          <div className="space-y-3">
            <ScoreBar label="Academic Fit" value={scores.academicFitScore} />
            <ScoreBar label="Financial Readiness" value={scores.financialReadinessScore} />
            <ScoreBar label="Language Readiness" value={scores.languageReadinessScore} />
            <ScoreBar label="Motivation Clarity" value={scores.motivationClarityScore} />
            <ScoreBar label="Timeline Urgency" value={scores.timelineUrgencyScore} />
            <ScoreBar label="Document Readiness" value={scores.documentReadinessScore} />
            <ScoreBar label="Visa Complexity" value={scores.visaComplexityScore} />
          </div>
        )}
      </div>

      {/* Disposition + completeness */}
      <div className="mt-6 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <span className="text-xs text-text-muted block mb-1">Recommended Disposition</span>
          <Badge variant={
            qualification.recommendedDisposition === 'assign_counsellor' ? 'success' :
            qualification.recommendedDisposition === 'nurture' ? 'info' :
            'warning'
          }>
            {formatDisposition(qualification.recommendedDisposition)}
          </Badge>
        </div>
        <div>
          <span className="text-xs text-text-muted block mb-1">Profile Completeness</span>
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 rounded-full bg-surface-sunken overflow-hidden">
              <div
                className="h-2 rounded-full bg-primary-500"
                style={{ width: `${(qualification.profileCompleteness ?? 0) * 100}%` }}
              />
            </div>
            <span className="text-sm font-mono font-semibold text-text-primary">
              {Math.round((qualification.profileCompleteness ?? 0) * 100)}%
            </span>
          </div>
        </div>
        {assessment?.visaRisk && (
          <div>
            <span className="text-xs text-text-muted block mb-1">Visa Risk</span>
            <Badge variant={
              assessment.visaRisk === 'low' ? 'success' :
              assessment.visaRisk === 'medium' ? 'warning' :
              assessment.visaRisk === 'high' ? 'danger' :
              'muted'
            }>
              {assessment.visaRisk}
            </Badge>
          </div>
        )}
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

function TimelineEntry({ item, isLast }: { item: TimelineItem; isLast: boolean }) {
  const icons: Record<string, { color: string; symbol: string }> = {
    stage_change: { color: 'bg-primary-100 text-primary-700', symbol: '→' },
    assignment: { color: 'bg-blue-100 text-blue-700', symbol: '⊕' },
    assessment: { color: 'bg-violet-100 text-violet-700', symbol: '◉' },
    activity: { color: 'bg-amber-100 text-amber-700', symbol: '◆' },
    note: { color: 'bg-gray-100 text-gray-600', symbol: '✎' },
    document: { color: 'bg-blue-100 text-blue-700', symbol: '⊞' },
  }

  const cfg = icons[item.type] ?? icons.note

  return (
    <div className="flex gap-3 pb-4">
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${cfg.color}`}>
          {cfg.symbol}
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm font-medium text-text-primary">{item.title}</p>
        {item.description && (
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{item.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-text-muted font-mono">
            {formatDateTime(item.timestamp)}
          </span>
          {item.actor && (
            <span className="text-[10px] text-text-muted">by {item.actor}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDisposition(d: string | null): string {
  if (!d) return 'Unknown'
  return d.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}
