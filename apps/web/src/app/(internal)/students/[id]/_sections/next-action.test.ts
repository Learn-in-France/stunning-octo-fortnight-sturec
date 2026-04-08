import { pickNextAction, type NextActionInputs } from './next-action'

const baseInputs: NextActionInputs = {
  hasAssignedCounsellor: true,
  overdueReminder: null,
  openDocBlockerCount: 0,
  latestOutcome: null,
  activeCampaign: null,
}

describe('pickNextAction', () => {
  it('returns no_counsellor when no counsellor is assigned', () => {
    const result = pickNextAction({ ...baseInputs, hasAssignedCounsellor: false })
    expect(result.kind.kind).toBe('no_counsellor')
    expect(result.tone).toBe('urgent')
    expect(result.headline).toBe('Assign a counsellor')
  })

  it('prioritises overdue reminder above doc blockers and follow-ups', () => {
    const result = pickNextAction({
      ...baseInputs,
      overdueReminder: { title: 'Chase transcript', dueAt: '2026-04-01T00:00:00.000Z' },
      openDocBlockerCount: 3,
      latestOutcome: { nextAction: 'Send offer letter', followUpDueAt: '2026-04-15T00:00:00.000Z' },
    })
    expect(result.kind.kind).toBe('overdue_reminder')
    expect(result.tone).toBe('urgent')
    expect(result.headline).toBe('Chase transcript')
  })

  it('returns doc_blocker when no overdue reminder but blockers exist', () => {
    const result = pickNextAction({ ...baseInputs, openDocBlockerCount: 2 })
    expect(result.kind.kind).toBe('doc_blocker')
    expect(result.tone).toBe('warning')
    expect(result.headline).toBe('Resolve 2 open document requirements')
  })

  it('handles single doc blocker with singular wording', () => {
    const result = pickNextAction({ ...baseInputs, openDocBlockerCount: 1 })
    expect(result.headline).toBe('Resolve 1 open document requirement')
  })

  it('returns follow_up_planned when no blockers but a meeting outcome exists', () => {
    const result = pickNextAction({
      ...baseInputs,
      latestOutcome: { nextAction: 'Confirm visa file', followUpDueAt: '2026-04-15T00:00:00.000Z' },
    })
    expect(result.kind.kind).toBe('follow_up_planned')
    expect(result.headline).toBe('Confirm visa file')
    expect(result.detail).toContain('15 Apr')
  })

  it('returns follow_up_planned without due date when followUpDueAt is null', () => {
    const result = pickNextAction({
      ...baseInputs,
      latestOutcome: { nextAction: 'Confirm visa file', followUpDueAt: null },
    })
    expect(result.kind.kind).toBe('follow_up_planned')
    expect(result.detail).toContain('latest recorded meeting outcome')
  })

  it('returns no_active_campaign when there is nothing else to do and no campaign is running', () => {
    const result = pickNextAction({ ...baseInputs })
    expect(result.kind.kind).toBe('no_active_campaign')
    expect(result.headline).toBe('Start the phase campaign')
  })

  it('returns campaign_step_ready when an active campaign has pending steps', () => {
    const result = pickNextAction({
      ...baseInputs,
      activeCampaign: {
        pack: { name: 'Consultation pack' },
        pendingStepCount: 2,
      },
    })
    expect(result.kind.kind).toBe('campaign_step_ready')
    expect(result.headline).toBe('Send 2 pending steps in Consultation pack')
  })

  it('returns campaign_step_ready with singular wording for one pending step', () => {
    const result = pickNextAction({
      ...baseInputs,
      activeCampaign: {
        pack: { name: 'Consultation pack' },
        pendingStepCount: 1,
      },
    })
    expect(result.headline).toBe('Send the next step in Consultation pack')
  })

  it('falls back to caught_up when active campaign exists but has nothing pending', () => {
    const result = pickNextAction({
      ...baseInputs,
      activeCampaign: {
        pack: { name: 'Consultation pack' },
        pendingStepCount: 0,
      },
    })
    expect(result.kind.kind).toBe('caught_up')
    expect(result.tone).toBe('success')
  })

  it('handles missing campaign pack name gracefully', () => {
    const result = pickNextAction({
      ...baseInputs,
      activeCampaign: {
        pack: null,
        pendingStepCount: 1,
      },
    })
    expect(result.kind.kind).toBe('campaign_step_ready')
    expect(result.headline).toContain('the active campaign')
  })
})
