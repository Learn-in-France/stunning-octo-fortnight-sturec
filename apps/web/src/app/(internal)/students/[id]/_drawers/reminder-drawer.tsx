'use client'

import { useEffect, useState } from 'react'

import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateReminder } from '@/features/counsellor/hooks/use-counsellor'

interface ReminderDrawerProps {
  open: boolean
  onClose: () => void
  studentId: string
}

const EMPTY_FORM = { title: '', dueAt: '' }

/**
 * Drawer for creating a follow-up reminder. Lifted out of
 * MeetingOutcomesTab so it's reachable directly from the page header.
 */
export function ReminderDrawer({ open, onClose, studentId }: ReminderDrawerProps) {
  const createReminder = useCreateReminder()
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (open) setForm(EMPTY_FORM)
  }, [open])

  const canSave = !!form.title.trim() && !!form.dueAt

  const handleSave = () => {
    if (!canSave) return
    createReminder.mutate(
      {
        studentId,
        title: form.title.trim(),
        dueAt: new Date(form.dueAt).toISOString(),
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
      title="Add Reminder"
      description="Set a clear due date when something must be followed up and shouldn't slip."
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            loading={createReminder.isPending}
            disabled={!canSave}
            onClick={handleSave}
          >
            Create reminder
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="Reminder"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="e.g., Follow up about transcripts"
        />
        <Input
          label="Due date"
          type="date"
          value={form.dueAt}
          onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
        />
      </div>
    </Drawer>
  )
}
