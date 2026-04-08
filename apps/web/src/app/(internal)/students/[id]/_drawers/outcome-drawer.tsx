'use client'

import { useEffect, useState } from 'react'

import { STAGE_DISPLAY_NAMES, STAGE_ORDER } from '@sturec/shared'
import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useBookings } from '@/features/bookings/hooks/use-bookings'
import { useRecordMeetingOutcome } from '@/features/counsellor/hooks/use-counsellor'

interface OutcomeDrawerProps {
  open: boolean
  onClose: () => void
  studentId: string
}

const EMPTY_FORM = {
  bookingId: '',
  outcome: '',
  nextAction: '',
  followUpDueAt: '',
  privateNote: '',
  stageAfter: '',
}

/**
 * Drawer for recording a meeting outcome. Lifted out of the
 * MeetingOutcomesTab so the form lands where the user clicked instead
 * of switching tabs and scrolling.
 */
export function OutcomeDrawer({ open, onClose, studentId }: OutcomeDrawerProps) {
  const { data: bookings } = useBookings()
  const recordOutcome = useRecordMeetingOutcome()
  const [form, setForm] = useState(EMPTY_FORM)

  // Reset form whenever the drawer opens fresh
  useEffect(() => {
    if (open) setForm(EMPTY_FORM)
  }, [open])

  const studentBookings = (bookings ?? []).filter(
    (b) => b.studentId === studentId && ['assigned', 'scheduled', 'completed'].includes(b.status),
  )

  const canSave = !!form.bookingId && !!form.outcome && !!form.nextAction.trim()

  const handleSave = () => {
    if (!canSave) return
    recordOutcome.mutate(
      {
        studentId,
        bookingId: form.bookingId,
        outcome: form.outcome,
        nextAction: form.nextAction.trim(),
        followUpDueAt: form.followUpDueAt || undefined,
        privateNote: form.privateNote.trim() || undefined,
        stageAfter: form.stageAfter || undefined,
      },
      {
        onSuccess: () => onClose(),
      },
    )
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Record Outcome"
      description="Log what happened in the latest meeting and decide the next case action."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            loading={recordOutcome.isPending}
            disabled={!canSave}
            onClick={handleSave}
          >
            Save outcome
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Select
          label="Meeting"
          options={[
            { value: '', label: 'Select a booking…' },
            ...studentBookings.map((b) => ({
              value: b.id,
              label: `${new Date(b.scheduledAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })} — ${b.status}`,
            })),
          ]}
          value={form.bookingId}
          onChange={(e) => setForm({ ...form, bookingId: e.target.value })}
        />
        <Select
          label="Outcome"
          options={[
            { value: '', label: 'Select an outcome…' },
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
          placeholder="Internal notes…"
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
      </div>
    </Drawer>
  )
}
