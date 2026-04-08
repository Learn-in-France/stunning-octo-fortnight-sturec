'use client'

import { useEffect, useState } from 'react'

import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCreateNote } from '@/features/students/hooks/use-students'

interface NoteDrawerProps {
  open: boolean
  onClose: () => void
  studentId: string
}

const NOTE_TYPE_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'risk', label: 'Risk' },
  { value: 'academic', label: 'Academic' },
  { value: 'finance', label: 'Finance' },
  { value: 'visa', label: 'Visa' },
  { value: 'meeting_outcome', label: 'Meeting outcome' },
]

const EMPTY_FORM = { noteType: 'general', content: '' }

/**
 * Drawer for adding an internal note. Lifted out of NotesTab so the
 * tab is read-only and adding a note is reachable from the page header.
 */
export function NoteDrawer({ open, onClose, studentId }: NoteDrawerProps) {
  const createNote = useCreateNote(studentId)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (open) setForm(EMPTY_FORM)
  }, [open])

  const canSave = form.content.trim().length > 0

  const handleSave = () => {
    if (!canSave) return
    createNote.mutate(
      { noteType: form.noteType, content: form.content.trim() },
      { onSuccess: () => onClose() },
    )
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Add Note"
      description="Internal-only. Notes are visible to counsellors and admins, never to students."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            loading={createNote.isPending}
            disabled={!canSave}
            onClick={handleSave}
          >
            Add note
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Select
          label="Type"
          value={form.noteType}
          onChange={(e) => setForm({ ...form, noteType: e.target.value })}
          options={NOTE_TYPE_OPTIONS}
        />
        <Textarea
          label="Content"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          placeholder="What should the next person on this case know?"
          rows={6}
        />
      </div>
    </Drawer>
  )
}
