import prisma from '../../lib/prisma.js'

export function findStudentByUserId(userId: string) {
  return prisma.student.findFirst({ where: { userId, deletedAt: null } })
}

export function findLeadByUserId(userId: string) {
  return prisma.lead.findFirst({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })
}

export function findAssessments(studentId: string, leadId?: string) {
  return prisma.aiAssessment.findMany({
    where: {
      OR: [
        { studentId },
        ...(leadId ? [{ leadId }] : []),
      ],
    },
    orderBy: { createdAt: 'desc' },
    select: { fieldsCollected: true },
  })
}

export function findStudentDocuments(studentId: string) {
  return prisma.document.findMany({
    where: { studentId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  })
}

export function findStudentRequirements(studentId: string) {
  return prisma.studentDocumentRequirement.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
  })
}

export function findStudentApplications(studentId: string) {
  return prisma.application.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    include: {
      program: { select: { name: true, university: { select: { name: true } } } },
      intake: { select: { intakeName: true } },
    },
  })
}

export function findStudentBookings(studentId: string) {
  return prisma.booking.findMany({
    where: { studentId },
    orderBy: { scheduledAt: 'desc' },
  })
}

export function findStudentNotifications(studentId: string) {
  return prisma.notificationLog.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

export function countStudentDocumentsByStatus(studentId: string) {
  return prisma.document.groupBy({
    by: ['status'],
    where: { studentId, deletedAt: null },
    _count: true,
  })
}

export function countStudentRequirements(studentId: string) {
  return prisma.studentDocumentRequirement.count({ where: { studentId } })
}

export function countStudentApplicationsByStatus(studentId: string) {
  return prisma.application.groupBy({
    by: ['status'],
    where: { studentId },
    _count: true,
  })
}

export function findStudentStageTransitions(studentId: string) {
  return prisma.stageTransition.findMany({
    where: { studentId },
    orderBy: { timestamp: 'asc' },
    select: { toStage: true, timestamp: true },
  })
}

export function findStudentApplicationById(studentId: string, applicationId: string) {
  return prisma.application.findFirst({
    where: { id: applicationId, studentId },
    include: {
      program: { select: { name: true, university: { select: { name: true } } } },
      intake: { select: { intakeName: true } },
    },
  })
}

export function updateStudentProfile(id: string, data: Record<string, unknown>) {
  return prisma.student.update({
    where: { id },
    data: data as any,
  })
}

export function getNotificationPreferences(studentId: string) {
  return prisma.student.findFirst({
    where: { id: studentId, deletedAt: null },
    select: { whatsappConsent: true, emailConsent: true },
  })
}

export function updateNotificationPreferences(
  studentId: string,
  data: { whatsappConsent?: boolean; emailConsent?: boolean },
) {
  return prisma.student.update({
    where: { id: studentId },
    data,
    select: { whatsappConsent: true, emailConsent: true },
  })
}

export function createSupportEntry(data: {
  studentId: string
  subject: string
  message: string
  category: string
}) {
  return prisma.notificationLog.create({
    data: {
      studentId: data.studentId,
      recipient: 'support-team',
      channel: 'email',
      provider: 'internal',
      templateKey: 'support_request',
      payloadJson: {
        subject: data.subject,
        message: data.message,
        category: data.category,
      } as any,
      status: 'pending',
    },
  })
}
