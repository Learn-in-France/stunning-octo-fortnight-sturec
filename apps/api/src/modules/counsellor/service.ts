import * as repo from './repository.js'
import { changeStage } from '../students/service.js'

// ─── Meeting Outcomes ──────────────────────────────────────

export async function recordMeetingOutcome(
  counsellorId: string,
  data: {
    bookingId: string
    studentId: string
    outcome: string
    nextAction: string
    followUpDueAt?: string
    privateNote?: string
    stageAfter?: string
  },
) {
  const outcome = await repo.createMeetingOutcome({
    bookingId: data.bookingId,
    studentId: data.studentId,
    counsellorId,
    outcome: data.outcome,
    nextAction: data.nextAction,
    followUpDueAt: data.followUpDueAt ? new Date(data.followUpDueAt) : undefined,
    privateNote: data.privateNote,
    stageAfter: data.stageAfter,
  })

  // If counsellor set a stage change, apply it
  if (data.stageAfter) {
    await changeStage(data.studentId, data.stageAfter, counsellorId, 'meeting_outcome', 'Stage updated from meeting outcome')
      .catch((err) => console.error('[counsellor] Failed to change stage after meeting:', err))
  }

  // If follow-up date is set, auto-create a reminder
  if (data.followUpDueAt) {
    await repo.createReminder({
      counsellorId,
      studentId: data.studentId,
      title: `Follow up: ${data.nextAction}`,
      dueAt: new Date(data.followUpDueAt),
      source: 'meeting_outcome',
    }).catch((err) => console.error('[counsellor] Failed to create follow-up reminder:', err))
  }

  return outcome
}

export function getMeetingOutcomes(studentId: string) {
  return repo.findMeetingOutcomes(studentId)
}

// ─── Reminders ──────────────────────────────────────────────

export function createReminder(
  counsellorId: string,
  data: {
    studentId: string
    title: string
    dueAt: string
    source?: string
  },
) {
  return repo.createReminder({
    counsellorId,
    studentId: data.studentId,
    title: data.title,
    dueAt: new Date(data.dueAt),
    source: data.source || 'manual',
  })
}

export function getReminders(counsellorId: string, status?: string) {
  return repo.findReminders(counsellorId, status)
}

export function completeReminder(id: string) {
  return repo.completeReminder(id)
}

export function dismissReminder(id: string) {
  return repo.dismissReminder(id)
}

// ─── Agenda ─────────────────────────────────────────────────

export function getAgenda(counsellorId: string) {
  return repo.getCounsellorAgenda(counsellorId)
}
