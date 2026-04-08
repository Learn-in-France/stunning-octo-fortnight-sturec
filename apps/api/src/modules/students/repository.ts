import prisma from '../../lib/prisma.js'
import type { Prisma, StudentStage } from '@prisma/client'

// ─── Students ─────────────────────────────────────────────────

export function findStudents(args: {
  skip: number
  take: number
  orderBy: Record<string, 'asc' | 'desc'>
  where?: Prisma.StudentWhereInput
}) {
  return prisma.student.findMany({
    where: { ...args.where, deletedAt: null },
    skip: args.skip,
    take: args.take,
    orderBy: args.orderBy,
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  })
}

export function countStudents(where?: Prisma.StudentWhereInput) {
  return prisma.student.count({ where: { ...where, deletedAt: null } })
}

const userSelect = { select: { firstName: true, lastName: true, email: true } } as const

export function findStudentById(id: string) {
  return prisma.student.findFirst({
    where: { id, deletedAt: null },
    include: { user: userSelect },
  })
}

export function findStudentByUserId(userId: string) {
  return prisma.student.findFirst({ where: { userId, deletedAt: null } })
}

export function updateStudent(id: string, data: Prisma.StudentUncheckedUpdateInput) {
  return prisma.student.update({
    where: { id },
    data,
    include: { user: userSelect },
  })
}

export function buildStudentWhere(filters: {
  stage?: string
  assignedCounsellorId?: string
  visaRisk?: string
  readinessMin?: number
  search?: string
  counsellorIdScope?: string
}): Prisma.StudentWhereInput {
  const where: Prisma.StudentWhereInput = {}

  if (filters.stage) where.stage = filters.stage as StudentStage
  if (filters.assignedCounsellorId) where.assignedCounsellorId = filters.assignedCounsellorId
  if (filters.visaRisk) where.visaRisk = filters.visaRisk as any
  if (filters.readinessMin) where.overallReadinessScore = { gte: filters.readinessMin }
  if (filters.search) {
    where.user = {
      OR: [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ],
    }
  }
  if (filters.counsellorIdScope) {
    where.assignedCounsellorId = filters.counsellorIdScope
  }

  return where
}

// ─── Stage Transitions ───────────────────────────────────────

export function createStageTransition(data: {
  studentId: string
  fromStage: StudentStage | null
  toStage: StudentStage
  changedByUserId: string
  changedByType: 'user' | 'system' | 'automation'
  reasonCode?: string
  reasonNote?: string
}) {
  return prisma.stageTransition.create({
    data: {
      studentId: data.studentId,
      fromStage: data.fromStage,
      toStage: data.toStage,
      changedByUserId: data.changedByUserId,
      changedByType: data.changedByType as any,
      reasonCode: data.reasonCode || 'manual_override',
      reasonNote: data.reasonNote,
    },
  })
}

export function findStageTransitions(studentId: string) {
  return prisma.stageTransition.findMany({
    where: { studentId },
    orderBy: { timestamp: 'desc' },
    include: {
      changedByUser: { select: { firstName: true, lastName: true } },
    },
  })
}

// ─── Assignments ─────────────────────────────────────────────

export function createAssignment(data: {
  studentId: string
  counsellorId: string
  assignedBy: string
  reason?: string
}) {
  return prisma.studentAssignment.create({ data })
}

export function findAssignments(studentId: string) {
  return prisma.studentAssignment.findMany({
    where: { studentId },
    orderBy: { assignedAt: 'desc' },
    include: {
      counsellor: { select: { firstName: true, lastName: true } },
      assignedByUser: { select: { firstName: true, lastName: true } },
    },
  })
}

export function unassignCurrent(studentId: string) {
  return prisma.studentAssignment.updateMany({
    where: { studentId, unassignedAt: null },
    data: { unassignedAt: new Date() },
  })
}

// ─── Notes ───────────────────────────────────────────────────

export function findNotes(studentId: string, args: { skip: number; take: number }) {
  return prisma.counsellorNote.findMany({
    where: { studentId },
    skip: args.skip,
    take: args.take,
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
    },
  })
}

export function countNotes(studentId: string) {
  return prisma.counsellorNote.count({ where: { studentId } })
}

export function createNote(data: {
  studentId: string
  authorId: string
  content: string
  noteType?: string
}) {
  return prisma.counsellorNote.create({
    data: {
      studentId: data.studentId,
      authorId: data.authorId,
      content: data.content,
      noteType: (data.noteType || 'general') as any,
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
    },
  })
}

// ─── Activities ──────────────────────────────────────────────

export function findStudentActivities(studentId: string, args: { skip: number; take: number }) {
  return prisma.counsellorActivityLog.findMany({
    where: { studentId },
    skip: args.skip,
    take: args.take,
    orderBy: { createdAt: 'desc' },
    include: {
      createdByUser: { select: { id: true, firstName: true, lastName: true } },
    },
  })
}

export function countStudentActivities(studentId: string) {
  return prisma.counsellorActivityLog.count({ where: { studentId } })
}

export function createStudentActivity(data: Prisma.CounsellorActivityLogUncheckedCreateInput) {
  return prisma.counsellorActivityLog.create({
    data,
    include: {
      createdByUser: { select: { id: true, firstName: true, lastName: true } },
    },
  })
}

// ─── Contacts ────────────────────────────────────────────────

export function findContacts(studentId: string) {
  return prisma.studentContact.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
  })
}

export function createContact(data: Prisma.StudentContactUncheckedCreateInput) {
  return prisma.studentContact.create({ data })
}

export function updateContact(id: string, data: Prisma.StudentContactUncheckedUpdateInput) {
  return prisma.studentContact.update({ where: { id }, data })
}

// ─── Consents ────────────────────────────────────────────────

export function findConsents(studentId: string) {
  return prisma.consentEvent.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
  })
}

export function createConsent(data: Prisma.ConsentEventUncheckedCreateInput) {
  return prisma.consentEvent.create({ data })
}

// ─── AI Assessments ──────────────────────────────────────────

export function findStudentAssessments(studentId: string) {
  return prisma.aiAssessment.findMany({
    where: {
      OR: [
        { studentId },
        { lead: { convertedStudentId: studentId } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  })
}

export function findStudentAssessmentById(studentId: string, assessmentId: string) {
  return prisma.aiAssessment.findFirst({
    where: {
      id: assessmentId,
      OR: [
        { studentId },
        { lead: { convertedStudentId: studentId } },
      ],
    },
  })
}

// ─── Case Log ───────────────────────────────────────────────

export async function findCaseLogData(studentId: string) {
  const [transitions, notes, activities, outcomes, reminders, assignments] = await Promise.all([
    prisma.stageTransition.findMany({
      where: { studentId },
      include: {
        changedByUser: { select: { firstName: true, lastName: true } },
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
    }),
    prisma.counsellorNote.findMany({
      where: { studentId },
      include: {
        author: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.counsellorActivityLog.findMany({
      where: { studentId },
      include: {
        createdByUser: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.meetingOutcomeLog.findMany({
      where: { studentId },
      include: {
        counsellor: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.counsellorReminder.findMany({
      where: { studentId },
      include: {
        counsellor: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.studentAssignment.findMany({
      where: { studentId },
      include: {
        counsellor: { select: { firstName: true, lastName: true } },
        assignedByUser: { select: { firstName: true, lastName: true } },
      },
      orderBy: { assignedAt: 'desc' },
      take: 50,
    }),
  ])

  return { transitions, notes, activities, outcomes, reminders, assignments }
}
