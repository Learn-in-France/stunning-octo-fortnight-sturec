import prisma from '../../lib/prisma.js'
import type { Prisma } from '@prisma/client'

// ─── Leads ───────────────────────────────────────────────────

export function countLeads(where?: Prisma.LeadWhereInput) {
  return prisma.lead.count({ where: { ...where, deletedAt: null } })
}

export function countLeadsByStatus(dateFilter?: Prisma.LeadWhereInput) {
  return prisma.lead.groupBy({
    by: ['status'],
    where: { ...dateFilter, deletedAt: null },
    _count: true,
  })
}

// ─── Students ────────────────────────────────────────────────

export function countStudents(where?: Prisma.StudentWhereInput) {
  return prisma.student.count({ where: { ...where, deletedAt: null } })
}

export function countStudentsByStage(dateFilter?: Prisma.StudentWhereInput) {
  return prisma.student.groupBy({
    by: ['stage'],
    where: { ...dateFilter, deletedAt: null },
    _count: true,
  })
}

// ─── Applications ────────────────────────────────────────────

export function countApplications(where?: Prisma.ApplicationWhereInput) {
  return prisma.application.count({ where })
}

export function countApplicationsByStatus(dateFilter?: Prisma.ApplicationWhereInput) {
  return prisma.application.groupBy({
    by: ['status'],
    where: dateFilter,
    _count: true,
  })
}

// ─── Documents ───────────────────────────────────────────────

export function countDocuments(where?: Prisma.DocumentWhereInput) {
  return prisma.document.count({ where: { ...where, deletedAt: null } })
}

export function countDocumentsByStatus(dateFilter?: Prisma.DocumentWhereInput) {
  return prisma.document.groupBy({
    by: ['status'],
    where: { ...dateFilter, deletedAt: null },
    _count: true,
  })
}

// ─── Bookings ────────────────────────────────────────────────

export function countBookingsByStatus(dateFilter?: Prisma.BookingWhereInput) {
  return prisma.booking.groupBy({
    by: ['status'],
    where: dateFilter,
    _count: true,
  })
}

export function findPendingAssignments() {
  return prisma.booking.findMany({
    where: { status: 'awaiting_assignment' },
    orderBy: { scheduledAt: 'desc' },
  })
}

// ─── Counsellor Analytics ───────────────────────────────────

export function findCounsellors() {
  return prisma.user.findMany({
    where: { role: 'counsellor', deletedAt: null, status: 'active' },
    select: { id: true, firstName: true, lastName: true, email: true },
  })
}

export function findCounsellorById(id: string) {
  return prisma.user.findFirst({
    where: { id, role: { in: ['counsellor', 'admin'] }, deletedAt: null },
    select: { id: true, firstName: true, lastName: true, email: true },
  })
}

export function countAssignedLeads(counsellorId: string) {
  return prisma.lead.count({
    where: { assignedCounsellorId: counsellorId, deletedAt: null, status: { notIn: ['converted', 'disqualified'] } },
  })
}

export function countAssignedStudents(counsellorId: string) {
  return prisma.student.count({
    where: { assignedCounsellorId: counsellorId, deletedAt: null },
  })
}

export function countCounsellorActivities(counsellorId: string) {
  return prisma.counsellorActivityLog.count({
    where: { counsellorId },
  })
}

export function countConvertedLeads(counsellorId: string) {
  return prisma.lead.count({
    where: { assignedCounsellorId: counsellorId, status: 'converted', deletedAt: null },
  })
}

export function countOverdueActions(counsellorId: string) {
  return prisma.counsellorActivityLog.count({
    where: {
      counsellorId,
      nextActionDueAt: { lt: new Date() },
    },
  })
}

export function findCounsellorActivitiesByType(counsellorId: string) {
  return prisma.counsellorActivityLog.groupBy({
    by: ['activityType'],
    where: { counsellorId },
    _count: true,
  })
}

export function findCounsellorActivitiesByChannel(counsellorId: string) {
  return prisma.counsellorActivityLog.groupBy({
    by: ['channel'],
    where: { counsellorId },
    _count: true,
  })
}

export function findRecentCounsellorActivities(counsellorId: string, limit = 10) {
  return prisma.counsellorActivityLog.findMany({
    where: { counsellorId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, activityType: true, channel: true, summary: true, createdAt: true },
  })
}

export function countCounsellorStudentsByStage(counsellorId: string) {
  return prisma.student.groupBy({
    by: ['stage'],
    where: { assignedCounsellorId: counsellorId, deletedAt: null },
    _count: true,
  })
}

// ─── Counsellor-Scoped Queries ─────────────────────────────

export function countLeadsByStatusForCounsellor(counsellorId: string) {
  return prisma.lead.groupBy({
    by: ['status'],
    where: { assignedCounsellorId: counsellorId, deletedAt: null },
    _count: true,
  })
}

export function countLeadsForCounsellor(counsellorId: string) {
  return prisma.lead.count({
    where: { assignedCounsellorId: counsellorId, deletedAt: null },
  })
}

export function countApplicationsByStatusForCounsellor(counsellorId: string) {
  return prisma.application.groupBy({
    by: ['status'],
    where: { student: { assignedCounsellorId: counsellorId, deletedAt: null } },
    _count: true,
  })
}

export function countDocumentsByStatusForCounsellor(counsellorId: string) {
  return prisma.document.groupBy({
    by: ['status'],
    where: { student: { assignedCounsellorId: counsellorId, deletedAt: null }, deletedAt: null },
    _count: true,
  })
}

export function countBookingsByStatusForCounsellor(counsellorId: string) {
  return prisma.booking.groupBy({
    by: ['status'],
    where: { counsellorId },
    _count: true,
  })
}

// ─── Student Analytics ──────────────────────────────────────

export function findStudentsForAnalytics() {
  return prisma.student.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      referenceCode: true,
      stage: true,
      stageUpdatedAt: true,
      userId: true,
      user: { select: { firstName: true, lastName: true } },
    },
    orderBy: { stageUpdatedAt: 'asc' },
  })
}

export function findStudentForAnalytics(id: string) {
  return prisma.student.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      referenceCode: true,
      stage: true,
      stageUpdatedAt: true,
      userId: true,
      user: { select: { firstName: true, lastName: true } },
    },
  })
}

export function countStudentDocuments(studentId: string, status?: string) {
  return prisma.document.count({
    where: { studentId, deletedAt: null, ...(status && { status: status as any }) },
  })
}

export function countStudentDocumentRequirements(studentId: string) {
  return prisma.studentDocumentRequirement.count({
    where: { studentId },
  })
}

export function countStudentApplications(studentId: string) {
  return prisma.application.count({ where: { studentId } })
}

export function countStudentApplicationsByStatus(studentId: string) {
  return prisma.application.groupBy({
    by: ['status'],
    where: { studentId },
    _count: true,
  })
}

export function findLastCounsellorActivity(studentId: string) {
  return prisma.counsellorActivityLog.findFirst({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  })
}

export function findStudentStageTransitions(studentId: string) {
  return prisma.stageTransition.findMany({
    where: { studentId },
    orderBy: { timestamp: 'asc' },
    select: { toStage: true, timestamp: true },
  })
}

export function findAllStageTransitions() {
  return prisma.stageTransition.findMany({
    orderBy: [{ studentId: 'asc' }, { timestamp: 'asc' }],
    select: { studentId: true, toStage: true, timestamp: true },
  })
}
