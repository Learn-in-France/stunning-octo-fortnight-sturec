'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAssignStudentCounsellor } from '@/features/students/hooks/use-students'
import { fetchTeamMembers } from '@/features/team/lib/team-cache'

interface ReassignDrawerProps {
  open: boolean
  onClose: () => void
  studentId: string
  currentCounsellorId: string | null
}

/**
 * Admin-only drawer for assigning or reassigning a student's
 * counsellor. Lifted out of the centered Modal so all student write
 * actions share the same right-side surface.
 *
 * Owns the team-list query so the page no longer needs to know about it.
 */
export function ReassignDrawer({
  open,
  onClose,
  studentId,
  currentCounsellorId,
}: ReassignDrawerProps) {
  const assignCounsellor = useAssignStudentCounsellor(studentId)

  // Only fetch the team list when the drawer is actually open
  const teamQuery = useQuery({
    queryKey: ['team', 'invite-and-assignment-options'],
    queryFn: fetchTeamMembers,
    enabled: open,
    staleTime: 60_000,
  })

  const availableCounsellors = (teamQuery.data ?? []).filter(
    (member) => member.role === 'counsellor' && member.status !== 'deactivated',
  )

  const [form, setForm] = useState({
    counsellorId: currentCounsellorId ?? '',
    reason: '',
  })

  useEffect(() => {
    if (open) {
      setForm({ counsellorId: currentCounsellorId ?? '', reason: '' })
    }
  }, [open, currentCounsellorId])

  const canSave = !!form.counsellorId && form.reason.trim().length > 0
  const isReassignment = !!currentCounsellorId

  const handleSave = () => {
    if (!canSave) return
    assignCounsellor.mutate(
      {
        counsellorId: form.counsellorId,
        reason: form.reason.trim(),
      },
      { onSuccess: () => onClose() },
    )
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isReassignment ? 'Reassign Counsellor' : 'Assign Counsellor'}
      description="Always add a clear handoff note so the next owner can pick the case up without losing context."
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            loading={assignCounsellor.isPending}
            disabled={!canSave}
            onClick={handleSave}
          >
            Save reassignment
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Select
          label="Counsellor"
          value={form.counsellorId}
          onChange={(e) => setForm((prev) => ({ ...prev, counsellorId: e.target.value }))}
          options={availableCounsellors.map((member) => ({
            value: member.id,
            label: `${member.firstName} ${member.lastName}`,
          }))}
          placeholder="Select counsellor"
        />
        <Textarea
          label="Handoff note"
          value={form.reason}
          onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
          placeholder="Why is this case being reassigned, and what should the next counsellor pick up first?"
          rows={5}
        />
      </div>
    </Drawer>
  )
}
