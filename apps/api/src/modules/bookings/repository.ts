import prisma from '../../lib/prisma.js'
import type { Prisma, BookingStatus } from '@prisma/client'

export function findBookings(where?: Prisma.BookingWhereInput) {
  return prisma.booking.findMany({
    where,
    orderBy: { scheduledAt: 'desc' },
  })
}

export function findBookingById(id: string) {
  return prisma.booking.findUnique({ where: { id } })
}

/**
 * Fetch a booking plus everything the notification templates need:
 * the student (or lead) contact info, the latest AI assessment summary,
 * and the assigned counsellor. Used by the booking notification path so
 * admins/counsellors/students receive emails with full context instead
 * of a bare "session confirmed" line.
 */
export async function findBookingContext(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      student: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          aiAssessments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              summaryForTeam: true,
              priorityLevel: true,
              qualificationScore: true,
            },
          },
        },
      },
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          aiAssessments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              summaryForTeam: true,
              priorityLevel: true,
              qualificationScore: true,
            },
          },
        },
      },
      counsellor: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  })
}

export function findStudentByUserId(userId: string) {
  return prisma.student.findFirst({
    where: { userId, deletedAt: null },
    select: { id: true, assignedCounsellorId: true },
  })
}

export function findStudentAccess(studentId: string) {
  return prisma.student.findFirst({
    where: { id: studentId, deletedAt: null },
    select: { id: true, userId: true, assignedCounsellorId: true },
  })
}

export function findLeadAccess(leadId: string) {
  return prisma.lead.findFirst({
    where: { id: leadId, deletedAt: null },
    select: { id: true, userId: true, assignedCounsellorId: true },
  })
}

export function createBooking(data: {
  studentId?: string
  leadId?: string
  counsellorId?: string | null
  scheduledAt: Date
  notes?: string
  status?: string
  source?: string
}) {
  return prisma.booking.create({
    data: {
      studentId: data.studentId,
      leadId: data.leadId,
      counsellorId: data.counsellorId ?? undefined,
      scheduledAt: data.scheduledAt,
      notes: data.notes,
      source: data.source,
      ...(data.status && { status: data.status as BookingStatus }),
      ...(data.counsellorId !== undefined && { counsellorId: data.counsellorId }),
    },
  })
}

export function updateBooking(id: string, data: {
  status?: string
  counsellorId?: string | null
  notes?: string
  scheduledAt?: Date
}) {
  return prisma.booking.update({
    where: { id },
    data: {
      ...(data.status && { status: data.status as BookingStatus }),
      ...(data.counsellorId !== undefined && { counsellorId: data.counsellorId }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.scheduledAt && { scheduledAt: data.scheduledAt }),
    },
  })
}
