'use client'

import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import {
  pickNextAction,
  type NextActionInputs,
  type NextActionTone,
} from './next-action'
import { useStudentRequirements } from '@/features/documents/hooks/use-documents'
// useStudentAssessments is intentionally not pulled here — the picker
// only needs reminder / blocker / outcome / campaign signals; the
// IdentityRail uses assessments for the lead-heat tile.
import {
  useCounsellorReminders,
  useMeetingOutcomes,
} from '@/features/counsellor/hooks/use-counsellor'
import { useStudentCampaigns } from '@/features/campaigns/hooks/use-campaigns'

interface NextActionCardProps {
  studentId: string
  hasAssignedCounsellor: boolean
  isAdmin: boolean
  onRecordOutcome: () => void
  onAddReminder: () => void
  onAddNote: () => void
  onManageCampaigns: () => void
  onChangeStage: () => void
  onReassign: () => void
}

/**
 * The "what should I do right now?" card. Sits at the very top of the
 * center column. Picks one deterministic next action based on the
 * existing data on the page (no new endpoints) and surfaces the right
 * write CTAs as direct drawer openers.
 *
 * Replaces the previous OperationalSummaryBlock entirely:
 * - identity / KPIs are in the left rail now
 * - "what should happen next?" + "working signals" + latest internal
 *   note are folded into this single focused card
 */
export function NextActionCard({
  studentId,
  hasAssignedCounsellor,
  isAdmin,
  onRecordOutcome,
  onAddReminder,
  onAddNote,
  onManageCampaigns,
  onChangeStage,
  onReassign,
}: NextActionCardProps) {
  const { data: outcomes } = useMeetingOutcomes(studentId)
  const { data: reminders } = useCounsellorReminders()
  const { data: requirements } = useStudentRequirements(studentId)
  const { data: campaigns } = useStudentCampaigns(studentId)

  const latestOutcome = outcomes?.[0] ?? null
  const studentReminders = (reminders ?? []).filter(
    (r: { student: { id: string } | null; status: string }) =>
      r.student?.id === studentId && r.status === 'pending',
  )
  const overdueReminder =
    studentReminders
      .filter((r: { dueAt: string }) => new Date(r.dueAt).getTime() < Date.now())
      .sort(
        (a: { dueAt: string }, b: { dueAt: string }) =>
          new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
      )[0] ?? null
  const pendingRequirements = (requirements?.items ?? []).filter(
    (r: { status: string }) => ['missing', 'requested', 'rejected'].includes(r.status),
  )
  const activeCampaign =
    (campaigns ?? []).find((c) => c.status === 'active') ?? null
  const pendingStepCount = activeCampaign
    ? (Array.isArray(activeCampaign.steps) ? activeCampaign.steps : []).filter(
        (s: { status: string }) => s.status === 'pending' || s.status === 'scheduled',
      ).length
    : 0

  const inputs: NextActionInputs = {
    hasAssignedCounsellor,
    overdueReminder: overdueReminder
      ? { title: overdueReminder.title, dueAt: overdueReminder.dueAt }
      : null,
    openDocBlockerCount: pendingRequirements.length,
    latestOutcome: latestOutcome
      ? {
          nextAction: latestOutcome.nextAction ?? null,
          followUpDueAt: latestOutcome.followUpDueAt ?? null,
        }
      : null,
    activeCampaign: activeCampaign
      ? {
          pack: { name: activeCampaign.pack?.name ?? null },
          pendingStepCount,
        }
      : null,
  }

  const result = pickNextAction(inputs)

  // Map the picked kind to the right set of action buttons
  const ctas = (() => {
    switch (result.kind.kind) {
      case 'no_counsellor':
        return isAdmin
          ? [{ label: 'Assign Counsellor', onClick: onReassign, variant: 'primary' as const }]
          : [{ label: 'Add Note', onClick: onAddNote, variant: 'secondary' as const }]
      case 'overdue_reminder':
        return [
          { label: 'Record Outcome', onClick: onRecordOutcome, variant: 'primary' as const },
          { label: 'Add Note', onClick: onAddNote, variant: 'secondary' as const },
        ]
      case 'doc_blocker':
        return [
          { label: 'Add Note', onClick: onAddNote, variant: 'primary' as const },
          { label: 'Add Reminder', onClick: onAddReminder, variant: 'secondary' as const },
        ]
      case 'follow_up_planned':
        return [
          { label: 'Record Outcome', onClick: onRecordOutcome, variant: 'primary' as const },
          { label: 'Add Reminder', onClick: onAddReminder, variant: 'secondary' as const },
        ]
      case 'no_active_campaign':
        return [
          { label: 'Manage Campaigns', onClick: onManageCampaigns, variant: 'primary' as const },
        ]
      case 'campaign_step_ready':
        return [
          { label: 'Manage Campaigns', onClick: onManageCampaigns, variant: 'primary' as const },
          { label: 'Record Outcome', onClick: onRecordOutcome, variant: 'secondary' as const },
        ]
      case 'caught_up':
      default:
        return [
          { label: 'Add Reminder', onClick: onAddReminder, variant: 'secondary' as const },
          { label: 'Add Note', onClick: onAddNote, variant: 'secondary' as const },
          { label: 'Change Stage', onClick: onChangeStage, variant: 'secondary' as const },
        ]
    }
  })()

  const badgeVariant = toneToBadgeVariant(result.tone)

  return (
    <Card className="mb-6">
      <CardHeader>
        <div>
          <CardTitle>Next action</CardTitle>
          <p className="mt-1 text-xs text-text-muted">
            One deterministic recommendation based on the case state right now.
          </p>
        </div>
        <Badge variant={badgeVariant} dot>
          {labelForTone(result.tone)}
        </Badge>
      </CardHeader>

      <div className="rounded-2xl border border-border bg-surface-sunken/35 p-4">
        <p className="text-sm font-semibold text-text-primary">{result.headline}</p>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{result.detail}</p>

        {latestOutcome?.privateNote && (
          <div className="mt-4 rounded-xl bg-white/70 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              Latest internal note
            </p>
            <p className="mt-1 text-sm text-text-secondary">{latestOutcome.privateNote}</p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {ctas.map((cta) => (
            <Button key={cta.label} size="sm" variant={cta.variant} onClick={cta.onClick}>
              {cta.label}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  )
}

function toneToBadgeVariant(
  tone: NextActionTone,
): 'danger' | 'warning' | 'info' | 'success' {
  switch (tone) {
    case 'urgent':
      return 'danger'
    case 'warning':
      return 'warning'
    case 'success':
      return 'success'
    case 'info':
    default:
      return 'info'
  }
}

function labelForTone(tone: NextActionTone): string {
  switch (tone) {
    case 'urgent':
      return 'Urgent'
    case 'warning':
      return 'Action needed'
    case 'success':
      return 'On track'
    case 'info':
    default:
      return 'Next up'
  }
}
