'use client'

import { useEffect, useState } from 'react'

import { STAGE_DISPLAY_NAMES, STAGE_ORDER, type StudentStage } from '@sturec/shared'
import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useChangeStudentStage } from '@/features/students/hooks/use-students'

interface StageDrawerProps {
  open: boolean
  onClose: () => void
  studentId: string
  currentStage: StudentStage
}

const REASON_OPTIONS = [
  { value: 'manual_review', label: 'Manual review' },
  { value: 'consultation_complete', label: 'Consultation complete' },
  { value: 'documents_progressed', label: 'Documents progressed' },
  { value: 'campaign_progressed', label: 'Campaign progressed' },
  { value: 'admin_override', label: 'Admin override' },
  { value: 'other', label: 'Other' },
]

/**
 * Drawer for changing a student's stage. Replaces the old centered
 * Modal so all student write actions share the same right-side surface.
 */
export function StageDrawer({ open, onClose, studentId, currentStage }: StageDrawerProps) {
  const changeStage = useChangeStudentStage(studentId)
  const [form, setForm] = useState({
    toStage: currentStage as string,
    reasonCode: 'manual_review',
    reasonNote: '',
  })

  // Reset form on every open with the latest current stage
  useEffect(() => {
    if (open) {
      setForm({
        toStage: currentStage as string,
        reasonCode: 'manual_review',
        reasonNote: '',
      })
    }
  }, [open, currentStage])

  const canSave = !!form.toStage && form.reasonNote.trim().length > 0

  const handleSave = () => {
    if (!canSave) return
    changeStage.mutate(
      {
        toStage: form.toStage as StudentStage,
        reasonCode: form.reasonCode || undefined,
        reasonNote: form.reasonNote.trim(),
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
      title="Change Stage"
      description="Use this when the case has genuinely moved forward or needs reclassification outside a meeting."
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            loading={changeStage.isPending}
            disabled={!canSave}
            onClick={handleSave}
          >
            Save stage change
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Select
          label="Move student to"
          value={form.toStage}
          onChange={(e) => setForm((prev) => ({ ...prev, toStage: e.target.value }))}
          options={STAGE_ORDER.map((stage) => ({
            value: stage,
            label: STAGE_DISPLAY_NAMES[stage],
          }))}
        />
        <Select
          label="Reason"
          value={form.reasonCode}
          onChange={(e) => setForm((prev) => ({ ...prev, reasonCode: e.target.value }))}
          options={REASON_OPTIONS}
        />
        <Textarea
          label="Internal note"
          value={form.reasonNote}
          onChange={(e) => setForm((prev) => ({ ...prev, reasonNote: e.target.value }))}
          placeholder="Why are you moving this student, and what should the next owner know?"
        />
      </div>
    </Drawer>
  )
}
