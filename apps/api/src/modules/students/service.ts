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
    counsellorIdScope: user.role === 'counsellor' ? user.id : undefined,
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

export async function assignCounsellor(id: string, counsellorId: string, assignedBy: string) {
  // Unassign current
  await repo.unassignCurrent(id)

  // Create new assignment
  const assignment = await repo.createAssignment({ studentId: id, counsellorId, assignedBy })

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
