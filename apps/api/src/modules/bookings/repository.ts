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

export function createBooking(data: {
  studentId?: string
  leadId?: string
  counsellorId: string
  scheduledAt: Date
  notes?: string
}) {
  return prisma.booking.create({
    data: {
      studentId: data.studentId,
      leadId: data.leadId,
      counsellorId: data.counsellorId,
      scheduledAt: data.scheduledAt,
      notes: data.notes,
    },
  })
}

export function updateBooking(id: string, data: {
  status?: string
  notes?: string
  scheduledAt?: Date
}) {
  return prisma.booking.update({
    where: { id },
    data: {
      ...(data.status && { status: data.status as BookingStatus }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.scheduledAt && { scheduledAt: data.scheduledAt }),
    },
  })
}
