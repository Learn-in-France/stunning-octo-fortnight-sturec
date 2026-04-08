import type {
  PaginatedResponse,
  StudentFilterInput,
  StudentListItem,
  StudentDetail,
  StudentOwnProfile,
  TimelineItem,
  NoteItem,
  ActivityLogItem,
  ContactItem,
  ConsentEventItem,
  AiAssessmentSummary,
  AssignmentHistoryItem,
  CaseLogItem,
} from '@sturec/shared'
import type { RequestUser } from '../../middleware/auth.js'

import * as repo from './repository.js'
import { toPrismaArgs, paginate } from '../../lib/pagination.js'
import { getNotificationsQueue, getMauticSyncQueue } from '../../lib/queue/index.js'
import {
  mapStudentToListItem,
  mapStudentToDetail,
  mapStudentToOwnProfile,
  mapStageTransition,
  mapNote,
  mapActivityLog,
  mapContact,
  mapConsentEvent,
  mapAiAssessmentToSummary,
  mapAssignment,
} from '../../lib/mappers/index.js'

// ─── List / Detail ───────────────────────────────────────────

export async function listStudents(
  filters: StudentFilterInput,
  user: RequestUser,
): Promise<PaginatedResponse<StudentListItem>> {
  const args = toPrismaArgs(filters)
  const where = repo.buildStudentWhere({
    ...filters,
  })

  const [items, total] = await Promise.all([
    repo.findStudents({ ...args, where }),
    repo.countStudents(where),
  ])
  return paginate(
    items.map((s) => mapStudentToListItem(s, s.user)),
    total,
    filters,
  )
}

export async function getStudent(id: string): Promise<StudentDetail | null> {
  const student = await repo.findStudentById(id)
  if (!student) return null
  return mapStudentToDetail(student)
}

export async function getOwnProfile(userId: string): Promise<StudentOwnProfile | null> {
  const student = await repo.findStudentByUserId(userId)
  if (!student) return null
  return mapStudentToOwnProfile(student)
}

export async function updateStudent(id: string, data: Record<string, unknown>) {
  const student = await repo.updateStudent(id, data)
  return mapStudentToDetail(student)
}

// ─── Stage Change ────────────────────────────────────────────

export async function changeStage(
  id: string,
  toStage: string,
  userId: string,
  reasonCode?: string,
  reasonNote?: string,
) {
  const student = await repo.findStudentById(id)
  if (!student) return null

  const fromStage = student.stage

  // Create transition record
  const transition = await repo.createStageTransition({
    studentId: id,
    fromStage,
    toStage: toStage as any,
    changedByUserId: userId,
    changedByType: 'user',
    reasonCode,
    reasonNote,
  })

  // Update student stage
  const updated = await repo.updateStudent(id, {
    stage: toStage as any,
    stageUpdatedAt: new Date(),
  })

  // Emit async side effects
  const transitionId = transition.id

  // Notify the student about stage change
  getNotificationsQueue().add('stage-change', {
    recipientId: student.userId,
    channel: 'email',
    templateKey: 'stage_changed',
    data: {
      studentId: id,
      fromStage,
      toStage,
      triggeringActionId: transitionId,
    },
  }).catch((err) => console.error('[students] Failed to enqueue stage notification:', err))

  // Sync stage to Mautic
  getMauticSyncQueue().add('stage-sync', {
    entityType: 'student',
    entityId: id,
    eventType: 'contact_updated',
    triggeringActionId: transitionId,
  }).catch((err) => console.error('[students] Failed to enqueue Mautic sync:', err))

  return mapStudentToDetail(updated)
}

// ─── Assignment ──────────────────────────────────────────────

export async function assignCounsellor(id: string, counsellorId: string, assignedBy: string, reason?: string) {
  // Unassign current
  await repo.unassignCurrent(id)

  // Create new assignment
  const assignment = await repo.createAssignment({ studentId: id, counsellorId, assignedBy, reason })

  // Update student
  const student = await repo.updateStudent(id, {
    assignedCounsellorId: counsellorId,
    assignedAt: new Date(),
  })

  // Notify the counsellor about new assignment
  getNotificationsQueue().add('student-assigned', {
    recipientId: counsellorId,
    channel: 'email',
    templateKey: 'student_assigned',
    data: {
      studentId: id,
      triggeringActionId: assignment.id,
    },
  }).catch((err) => console.error('[students] Failed to enqueue assignment notification:', err))

  return mapStudentToDetail(student)
}

export async function listAssignments(studentId: string): Promise<AssignmentHistoryItem[]> {
  const assignments = await repo.findAssignments(studentId)
  return assignments.map((a) => mapAssignment(a, a.counsellor))
}

export async function listCaseLog(studentId: string): Promise<CaseLogItem[]> {
  const data = await repo.findCaseLogData(studentId)

  const items: CaseLogItem[] = [
    ...data.transitions.map((transition) => ({
      id: transition.id,
      kind: 'stage_change' as const,
      title: transition.fromStage
        ? `Stage changed: ${transition.fromStage} → ${transition.toStage}`
        : `Stage set to ${transition.toStage}`,
      summary: transition.reasonNote ?? transition.reasonCode ?? null,
      detail: null,
      actorName: transition.changedByUser
        ? `${transition.changedByUser.firstName} ${transition.changedByUser.lastName}`.trim()
        : null,
      status: transition.toStage,
      dueAt: null,
      createdAt: transition.timestamp.toISOString(),
    })),
    ...data.notes.map((note) => ({
      id: note.id,
      kind: 'note' as const,
      title: `Note · ${note.noteType.replace(/_/g, ' ')}`,
      summary: null,
      detail: note.content,
      actorName: `${note.author.firstName} ${note.author.lastName}`.trim(),
      status: note.noteType,
      dueAt: null,
      createdAt: note.createdAt.toISOString(),
    })),
    ...data.activities.map((activity) => ({
      id: activity.id,
      kind: 'activity' as const,
      title: `${activity.activityType.replace(/_/g, ' ')} · ${activity.channel.replace(/_channel$/, '').replace(/_/g, ' ')}`,
      summary: activity.outcome ?? null,
      detail: activity.summary ?? null,
      actorName: `${activity.createdByUser.firstName} ${activity.createdByUser.lastName}`.trim(),
      status: activity.direction,
      dueAt: activity.nextActionDueAt?.toISOString() ?? null,
      createdAt: activity.createdAt.toISOString(),
    })),
    ...data.outcomes.map((outcome) => ({
      id: outcome.id,
      kind: 'meeting_outcome' as const,
      title: `Meeting outcome · ${outcome.outcome.replace(/_/g, ' ')}`,
      summary: outcome.nextAction,
      detail: outcome.privateNote ?? null,
      actorName: `${outcome.counsellor.firstName} ${outcome.counsellor.lastName}`.trim(),
      status: outcome.stageAfter ?? outcome.outcome,
      dueAt: outcome.followUpDueAt?.toISOString() ?? null,
      createdAt: outcome.createdAt.toISOString(),
    })),
    ...data.reminders.map((reminder) => ({
      id: reminder.id,
      kind: 'reminder' as const,
      title: reminder.title,
      summary: `Reminder source: ${reminder.source.replace(/_/g, ' ')}`,
      detail: null,
      actorName: `${reminder.counsellor.firstName} ${reminder.counsellor.lastName}`.trim(),
      status: reminder.status,
      dueAt: reminder.dueAt.toISOString(),
      createdAt: reminder.createdAt.toISOString(),
    })),
    ...data.assignments.map((assignment) => ({
      id: assignment.id,
      kind: 'assignment' as const,
      title: `Assigned to ${assignment.counsellor.firstName} ${assignment.counsellor.lastName}`.trim(),
      summary: assignment.reason ?? (assignment.unassignedAt
        ? 'Assignment later ended'
        : 'Current assignment created'),
      detail: assignment.reason ?? null,
      actorName: `${assignment.assignedByUser.firstName} ${assignment.assignedByUser.lastName}`.trim(),
      status: assignment.unassignedAt ? 'unassigned' : 'active',
      dueAt: null,
      createdAt: assignment.assignedAt.toISOString(),
    })),
  ]

  return items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
}

// ─── Timeline ────────────────────────────────────────────────

export async function listTimeline(studentId: string): Promise<TimelineItem[]> {
  const transitions = await repo.findStageTransitions(studentId)
  return transitions.map(mapStageTransition)
}

// ─── Notes ───────────────────────────────────────────────────

export async function listNotes(
  studentId: string,
  pagination: { page: number; limit: number },
): Promise<PaginatedResponse<NoteItem>> {
  const skip = (pagination.page - 1) * pagination.limit
  const [items, total] = await Promise.all([
    repo.findNotes(studentId, { skip, take: pagination.limit }),
    repo.countNotes(studentId),
  ])
  return paginate(
    items.map((n) => mapNote(n, n.author)),
    total,
    { ...pagination, sortBy: 'created_at', sortOrder: 'desc' },
  )
}

export async function createNote(
  studentId: string,
  data: { content: string; noteType?: string },
  userId: string,
) {
  const note = await repo.createNote({
    studentId,
    authorId: userId,
    content: data.content,
    noteType: data.noteType,
  })
  return mapNote(note, note.author)
}

// ─── Activities ──────────────────────────────────────────────

export async function listActivities(
  studentId: string,
  pagination: { page: number; limit: number },
): Promise<PaginatedResponse<ActivityLogItem>> {
  const skip = (pagination.page - 1) * pagination.limit
  const [items, total] = await Promise.all([
    repo.findStudentActivities(studentId, { skip, take: pagination.limit }),
    repo.countStudentActivities(studentId),
  ])
  return paginate(
    items.map((a) => mapActivityLog(a, a.createdByUser)),
    total,
    { ...pagination, sortBy: 'created_at', sortOrder: 'desc' },
  )
}

export async function createActivity(
  studentId: string,
  data: {
    activityType: string
    channel: string
    direction: string
    outcome?: string
    summary?: string
    nextActionDueAt?: string
    durationMinutes?: number
  },
  userId: string,
) {
  const student = await repo.findStudentById(studentId)
  if (!student) return null

  const activity = await repo.createStudentActivity({
    studentId,
    counsellorId: student.assignedCounsellorId || userId,
    createdByUserId: userId,
    activityType: data.activityType as any,
    channel: data.channel as any,
    direction: data.direction as any,
    outcome: data.outcome,
    summary: data.summary,
    nextActionDueAt: data.nextActionDueAt ? new Date(data.nextActionDueAt) : undefined,
    durationMinutes: data.durationMinutes,
  })

  return mapActivityLog(activity, activity.createdByUser)
}

// ─── Contacts ────────────────────────────────────────────────

export async function listContacts(studentId: string): Promise<ContactItem[]> {
  const contacts = await repo.findContacts(studentId)
  return contacts.map(mapContact)
}

export async function createContact(
  studentId: string,
  data: {
    contactType: string
    name: string
    relation: string
    phone?: string
    email?: string
    isPrimary?: boolean
  },
) {
  const contact = await repo.createContact({
    studentId,
    type: data.contactType as any,
    name: data.name,
    relation: data.relation,
    phone: data.phone,
    email: data.email,
    isPrimary: data.isPrimary || false,
  })
  return mapContact(contact)
}

export async function updateContact(
  contactId: string,
  data: {
    name?: string
    relation?: string
    phone?: string
    email?: string
    isPrimary?: boolean
  },
): Promise<ContactItem | null> {
  try {
    const contact = await repo.updateContact(contactId, data as any)
    return mapContact(contact)
  } catch {
    return null
  }
}

// ─── Consents ────────────────────────────────────────────────

export async function listConsents(studentId: string): Promise<ConsentEventItem[]> {
  const consents = await repo.findConsents(studentId)
  return consents.map(mapConsentEvent)
}

export async function createConsent(
  studentId: string,
  data: { consentType: string; granted: boolean; source?: string },
  userId: string | null,
) {
  const consent = await repo.createConsent({
    studentId,
    consentType: data.consentType as any,
    granted: data.granted,
    source: (data.source || 'form') as any,
    capturedByUserId: userId,
  })
  return mapConsentEvent(consent)
}

// ─── AI Assessments ──────────────────────────────────────────

export async function listAssessments(studentId: string): Promise<AiAssessmentSummary[]> {
  const assessments = await repo.findStudentAssessments(studentId)
  return assessments.map(mapAiAssessmentToSummary)
}

export async function getAssessment(
  studentId: string,
  assessmentId: string,
): Promise<AiAssessmentSummary | null> {
  const assessment = await repo.findStudentAssessmentById(studentId, assessmentId)
  if (!assessment) return null
  return mapAiAssessmentToSummary(assessment)
}
