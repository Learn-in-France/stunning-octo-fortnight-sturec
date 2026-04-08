import prisma from '../../lib/prisma.js'

export function findStudentByUserId(userId: string) {
  return prisma.student.findFirst({
    where: { userId, deletedAt: null },
    include: {
      user: {
        select: { firstName: true, lastName: true, email: true, phone: true },
      },
    },
  })
}

/**
 * Apply the onboarding gate completion atomically: update the user's
 * name + phone, the student's WhatsApp consent + audit trail, and
 * stamp `onboarding_completed_at`. Returns the refreshed student row
 * with the user join so the caller can map it straight to a DTO.
 */
export async function completeOnboardingTx(args: {
  userId: string
  studentId: string
  firstName: string
  lastName: string
  phoneE164: string
  whatsappConsent: boolean
}) {
  const now = new Date()
  const [, , refreshed] = await prisma.$transaction([
    prisma.user.update({
      where: { id: args.userId },
      data: {
        firstName: args.firstName,
        lastName: args.lastName,
        phone: args.phoneE164,
      },
    }),
    prisma.student.update({
      where: { id: args.studentId },
      data: {
        whatsappConsent: args.whatsappConsent,
        whatsappConsentAt: args.whatsappConsent ? now : null,
        whatsappConsentSource: 'portal_onboarding',
        onboardingCompletedAt: now,
      },
    }),
    prisma.student.findFirstOrThrow({
      where: { id: args.studentId, deletedAt: null },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, phone: true },
        },
      },
    }),
  ])
  return refreshed
}

/**
 * Idempotent backfill: if a student already has first/last name and a
 * phone number that looks like a usable E.164, mark them
 * `onboarding_completed_at = NOW()` so they aren't redirected to the
 * gate. Called lazily on the next /students/me read.
 */
export async function maybeBackfillOnboarding(args: {
  studentId: string
  firstName: string | null
  lastName: string | null
  phone: string | null
}) {
  if (!args.firstName?.trim() || !args.lastName?.trim()) return
  if (!args.phone || !/^\+[1-9]\d{7,14}$/.test(args.phone)) return
  await prisma.student.update({
    where: { id: args.studentId },
    data: { onboardingCompletedAt: new Date() },
  })
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
