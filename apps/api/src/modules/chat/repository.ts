import prisma from '../../lib/prisma.js'
import type { Prisma } from '@prisma/client'

// ─── Sessions ───────────────────────────────────────────────

export function findSessionsByUser(userId: string) {
  return prisma.chatSession.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
  })
}

export function findSessionById(id: string) {
  return prisma.chatSession.findFirst({
    where: { id },
  })
}

export function findActiveSession(userId: string) {
  return prisma.chatSession.findFirst({
    where: { userId, status: 'active' },
    orderBy: { startedAt: 'desc' },
  })
}

export function createSession(data: {
  userId: string
  leadId: string
  studentId?: string | null
}) {
  return prisma.chatSession.create({
    data: {
      userId: data.userId,
      leadId: data.leadId,
      studentId: data.studentId,
    },
  })
}

export function endSession(id: string) {
  return prisma.chatSession.update({
    where: { id },
    data: { status: 'completed', endedAt: new Date() },
  })
}

// ─── Messages ───────────────────────────────────────────────

export function findMessages(sessionId: string) {
  return prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { timestamp: 'asc' },
  })
}

export function findRecentMessages(sessionId: string, limit = 8) {
  return prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { timestamp: 'desc' },
    take: limit,
  })
}

export function createMessage(data: {
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
}) {
  return prisma.chatMessage.create({
    data: {
      sessionId: data.sessionId,
      role: data.role as any,
      content: data.content,
    },
  })
}

// ─── AI Assessments ─────────────────────────────────────────

export function findLatestAssessment(opts: { studentId?: string; leadId?: string }) {
  return prisma.aiAssessment.findFirst({
    where: {
      ...(opts.studentId && { studentId: opts.studentId }),
      ...(opts.leadId && { leadId: opts.leadId }),
    },
    orderBy: { createdAt: 'desc' },
  })
}

export function createAssessment(data: Prisma.AiAssessmentUncheckedCreateInput) {
  return prisma.aiAssessment.create({ data })
}

// ─── Lead resolution ────────────────────────────────────────

export function findLeadByUserId(userId: string) {
  return prisma.lead.findFirst({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  })
}

export function findStudentByUserId(userId: string) {
  return prisma.student.findFirst({
    where: { userId, deletedAt: null },
  })
}

export function createLeadForChat(data: {
  userId: string
  email: string
  firstName: string
  lastName: string
}) {
  return prisma.lead.create({
    data: {
      userId: data.userId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      source: 'marketing' as any, // Chat-originated leads; no 'chat' enum value in schema
      status: 'new_lead',
    },
  })
}

export function updateLeadScores(
  leadId: string,
  data: {
    qualificationScore: number
    priorityLevel: string
    profileCompleteness: number | null
  },
) {
  return prisma.lead.update({
    where: { id: leadId },
    data: {
      qualificationScore: data.qualificationScore,
      priorityLevel: data.priorityLevel as any,
      profileCompleteness: data.profileCompleteness,
    },
  })
}

// ─── Program matching ───────────────────────────────────────

export function findMatchingPrograms(criteria: {
  gpa?: number
  englishScore?: number
  budget?: number
}) {
  const where: Prisma.ProgramWhereInput = { active: true }

  if (criteria.gpa != null) {
    where.OR = [
      { minimumGpa: null },
      { minimumGpa: { lte: criteria.gpa } },
    ]
  }
  if (criteria.englishScore != null) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      {
        OR: [
          { englishMinimumScore: null },
          { englishMinimumScore: { lte: criteria.englishScore } },
        ],
      },
    ]
  }
  if (criteria.budget != null) {
    where.tuitionAmount = { lte: criteria.budget }
  }

  return prisma.program.findMany({
    where,
    include: { university: { select: { name: true } } },
    take: 10,
  })
}
