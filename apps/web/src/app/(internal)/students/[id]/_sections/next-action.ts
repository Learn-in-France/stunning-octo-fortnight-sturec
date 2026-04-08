/**
 * Deterministic next-action picker for the student detail case desk.
 *
 * Pure function over the data the page already has — no new endpoints,
 * no new hooks. The output is consumed by NextActionCard which maps it
 * to a UI surface plus action buttons.
 *
 * Priority order (highest first):
 *   1. no counsellor assigned          → admin must assign before anything else
 *   2. overdue reminder                → most urgent ongoing work
 *   3. open document blockers          → student is blocked, action it
 *   4. recorded follow-up due soon     → execute the planned next step
 *   5. no active campaign              → start the phase campaign
 *   6. campaign step ready to send     → send the next nudge
 *   7. caught up                       → no urgent next action
 */

export type NextActionKind =
  | { kind: 'no_counsellor' }
  | {
      kind: 'overdue_reminder'
      title: string
      dueAt: string
    }
  | {
      kind: 'doc_blocker'
      openCount: number
    }
  | {
      kind: 'follow_up_planned'
      nextAction: string
      dueAt: string | null
    }
  | { kind: 'no_active_campaign' }
  | {
      kind: 'campaign_step_ready'
      packName: string
      pendingSteps: number
    }
  | { kind: 'caught_up' }

export type NextActionTone = 'urgent' | 'warning' | 'info' | 'success'

export interface NextActionResult {
  kind: NextActionKind
  tone: NextActionTone
  headline: string
  detail: string
}

export interface NextActionInputs {
  hasAssignedCounsellor: boolean
  overdueReminder: { title: string; dueAt: string } | null
  openDocBlockerCount: number
  latestOutcome: { nextAction: string | null; followUpDueAt: string | null } | null
  activeCampaign: { pack: { name: string | null } | null; pendingStepCount: number } | null
}

export function pickNextAction(inputs: NextActionInputs): NextActionResult {
  // 1. No counsellor — nothing else can happen until ownership is set
  if (!inputs.hasAssignedCounsellor) {
    return {
      kind: { kind: 'no_counsellor' },
      tone: 'urgent',
      headline: 'Assign a counsellor',
      detail: 'This case cannot progress until a counsellor owns it.',
    }
  }

  // 2. Overdue reminder — most urgent ongoing work
  if (inputs.overdueReminder) {
    return {
      kind: {
        kind: 'overdue_reminder',
        title: inputs.overdueReminder.title,
        dueAt: inputs.overdueReminder.dueAt,
      },
      tone: 'urgent',
      headline: inputs.overdueReminder.title,
      detail: `Follow-up was due ${formatShort(inputs.overdueReminder.dueAt)} and hasn't been actioned.`,
    }
  }

  // 3. Open document blockers
  if (inputs.openDocBlockerCount > 0) {
    return {
      kind: { kind: 'doc_blocker', openCount: inputs.openDocBlockerCount },
      tone: 'warning',
      headline:
        inputs.openDocBlockerCount === 1
          ? 'Resolve 1 open document requirement'
          : `Resolve ${inputs.openDocBlockerCount} open document requirements`,
      detail: 'The document checklist still has open items blocking progress.',
    }
  }

  // 4. Recorded follow-up still pending
  if (inputs.latestOutcome?.nextAction) {
    return {
      kind: {
        kind: 'follow_up_planned',
        nextAction: inputs.latestOutcome.nextAction,
        dueAt: inputs.latestOutcome.followUpDueAt,
      },
      tone: 'info',
      headline: inputs.latestOutcome.nextAction,
      detail: inputs.latestOutcome.followUpDueAt
        ? `Follow-up planned for ${formatShort(inputs.latestOutcome.followUpDueAt)}.`
        : 'This came from the latest recorded meeting outcome.',
    }
  }

  // 5. No active campaign
  if (!inputs.activeCampaign) {
    return {
      kind: { kind: 'no_active_campaign' },
      tone: 'info',
      headline: 'Start the phase campaign',
      detail: 'No active campaign is running for this student yet.',
    }
  }

  // 6. Active campaign with steps ready to send
  if (inputs.activeCampaign.pendingStepCount > 0) {
    const packName = inputs.activeCampaign.pack?.name ?? 'the active campaign'
    return {
      kind: {
        kind: 'campaign_step_ready',
        packName,
        pendingSteps: inputs.activeCampaign.pendingStepCount,
      },
      tone: 'info',
      headline:
        inputs.activeCampaign.pendingStepCount === 1
          ? `Send the next step in ${packName}`
          : `Send ${inputs.activeCampaign.pendingStepCount} pending steps in ${packName}`,
      detail: 'There are campaign steps ready to send right now.',
    }
  }

  // 7. Default — caught up
  return {
    kind: { kind: 'caught_up' },
    tone: 'success',
    headline: 'Caught up',
    detail: 'No urgent blocker is recorded right now. Add a note or schedule the next follow-up when needed.',
  }
}

function formatShort(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  })
}
