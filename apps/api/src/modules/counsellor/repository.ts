import prisma from '../../lib/prisma.js'
import type { MeetingOutcome, ReminderStatus } from '@prisma/client'

// ─── Meeting Outcomes ──────────────────────────────────────

export function createMeetingOutcome(data: {
  bookingId: string
  studentId: string
  counsellorId: string
  outcome: string
  nextAction: string
  followUpDueAt?: Date
  privateNote?: string
  studentVisibleNote?: string
  stageAfter?: string
}) {
  return prisma.meetingOutcomeLog.create({
    data: {
      bookingId: data.bookingId,
      studentId: data.studentId,
      counsellorId: data.counsellorId,
      outcome: data.outcome as MeetingOutcome,
      nextAction: data.nextAction,
      followUpDueAt: data.followUpDueAt,
      privateNote: data.privateNote,
      studentVisibleNote: data.studentVisibleNote,
      stageAfter: data.stageAfter,
    },
  })
}

export function findMeetingOutcomes(studentId: string) {
  return prisma.meetingOutcomeLog.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
  })
}

export function findLatestMeetingOutcome(studentId: string) {
  return prisma.meetingOutcomeLog.findFirst({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
  })
}

// ─── Reminders ──────────────────────────────────────────────

export function createReminder(data: {
  counsellorId: string
  studentId: string
  title: string
  dueAt: Date
  source: string
}) {
  return prisma.counsellorReminder.create({
    data: {
      counsellorId: data.counsellorId,
      studentId: data.studentId,
      title: data.title,
      dueAt: data.dueAt,
      source: data.source,
    },
  })
}

export function findReminders(counsellorId: string, status?: string) {
  return prisma.counsellorReminder.findMany({
    where: {
      counsellorId,
      ...(status && { status: status as ReminderStatus }),
    },
    include: { student: { select: { id: true, userId: true } } },
    orderBy: { dueAt: 'asc' },
  })
}

export function findOverdueReminders(counsellorId: string) {
  return prisma.counsellorReminder.findMany({
    where: {
      counsellorId,
      status: 'pending',
      dueAt: { lt: new Date() },
    },
    include: { student: { select: { id: true, userId: true } } },
    orderBy: { dueAt: 'asc' },
  })
}

export function completeReminder(id: string) {
  return prisma.counsellorReminder.update({
    where: { id },
    data: { status: 'completed', completedAt: new Date() },
  })
}

export function dismissReminder(id: string) {
  return prisma.counsellorReminder.update({
    where: { id },
    data: { status: 'dismissed' },
  })
}

// ─── Agenda ─────────────────────────────────────────────────

export async function getCounsellorAgenda(counsellorId: string) {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

  const [todayBookings, overdueReminders, pendingReminders, docsWaitingReview, staleStudents] =
    await Promise.all([
      // Today's meetings
      prisma.booking.findMany({
        where: {
          counsellorId,
          scheduledAt: { gte: startOfDay, lt: endOfDay },
          status: { in: ['scheduled', 'assigned'] },
        },
        include: {
          student: { select: { id: true, userId: true } },
        },
        orderBy: { scheduledAt: 'asc' },
      }),

      // Overdue follow-ups
      prisma.counsellorReminder.findMany({
        where: {
          counsellorId,
          status: 'pending',
          dueAt: { lt: now },
        },
        include: { student: { select: { id: true, userId: true } } },
        orderBy: { dueAt: 'asc' },
        take: 20,
      }),

      // Upcoming reminders (next 7 days)
      prisma.counsellorReminder.findMany({
        where: {
          counsellorId,
          status: 'pending',
          dueAt: { gte: now, lt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
        },
        include: { student: { select: { id: true, userId: true } } },
        orderBy: { dueAt: 'asc' },
        take: 20,
      }),

      // Documents shared but not yet reviewed (pending status, shared with this counsellor)
      prisma.document.findMany({
        where: {
          sharedWithCounsellorId: counsellorId,
          sharedAt: { not: null },
          revokedAt: null,
          status: 'pending',
          deletedAt: null,
        },
        select: { id: true, filename: true, type: true, studentId: true, sharedAt: true },
        take: 20,
      }),

      // Stale students (assigned to this counsellor, no activity in 14+ days)
      prisma.student.findMany({
        where: {
          assignedCounsellorId: counsellorId,
          deletedAt: null,
          updatedAt: { lt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
          stage: { notIn: ['arrived_france', 'alumni'] },
        },
        select: { id: true, userId: true, stage: true, updatedAt: true },
        take: 20,
      }),
    ])

  return {
    todayMeetings: todayBookings,
    overdueReminders,
    upcomingReminders: pendingReminders,
    docsWaitingReview,
    staleStudents,
  }
}
