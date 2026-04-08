'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ActionRailProps {
  isAdmin: boolean
  hasAssignedCounsellor: boolean
  onRecordOutcome: () => void
  onAddReminder: () => void
  onAddNote: () => void
  onManageCampaigns: () => void
  onChangeStage: () => void
  onReassign: () => void
}

/**
 * Sticky right rail. The single source of "what can I do here?" for
 * the student detail page. Every button opens a drawer (the only
 * write surface). Admin-only items are grouped under a divider.
 *
 * Used in two modes:
 * - desktop (xl+): vertical sticky column on the right
 * - mobile / tablet: same component rendered as a sticky bottom bar
 *   via a wrapping container with different positioning
 *
 * The component itself just renders the buttons in a flex column —
 * the wrapper decides positioning/orientation.
 */
export function ActionRail({
  isAdmin,
  hasAssignedCounsellor,
  onRecordOutcome,
  onAddReminder,
  onAddNote,
  onManageCampaigns,
  onChangeStage,
  onReassign,
}: ActionRailProps) {
  return (
    <Card className="flex flex-col gap-1.5 p-4">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
        Actions
      </p>
      <Button size="sm" variant="primary" className="w-full justify-start" onClick={onRecordOutcome}>
        Record Outcome
      </Button>
      <Button size="sm" variant="secondary" className="w-full justify-start" onClick={onAddReminder}>
        Add Reminder
      </Button>
      <Button size="sm" variant="secondary" className="w-full justify-start" onClick={onAddNote}>
        Add Note
      </Button>
      <Button size="sm" variant="secondary" className="w-full justify-start" onClick={onManageCampaigns}>
        Manage Campaigns
      </Button>
      <Button size="sm" variant="secondary" className="w-full justify-start" onClick={onChangeStage}>
        Change Stage
      </Button>

      {isAdmin && (
        <>
          <div className="my-2 border-t border-border" />
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            Admin
          </p>
          <Button size="sm" variant="secondary" className="w-full justify-start" onClick={onReassign}>
            {hasAssignedCounsellor ? 'Reassign Counsellor' : 'Assign Counsellor'}
          </Button>
        </>
      )}
    </Card>
  )
}
