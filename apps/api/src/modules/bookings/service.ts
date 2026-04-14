import type { BookingListItem } from '@sturec/shared'
import type { RequestUser } from '../../middleware/auth.js'

import * as repo from './repository.js'
import { mapBooking } from '../../lib/mappers/index.js'
import { getNotificationsQueue, getAiProcessingQueue } from '../../lib/queue/index.js'

export async function listBookings(user: RequestUser): Promise<BookingListItem[]> {
  let where = {}

  if (user.role === 'student') {
    where = { student: { userId: user.id } }
  } else if (user.role === 'counsellor') {
    where = { counsellorId: user.id }
  }
  // admin sees all — no where filter

  const bookings = await repo.findBookings(where)
  return bookings.map(mapBooking)
}

export async function createBooking(
  user: RequestUser,
  data: {
    studentId?: string
    leadId?: string
    counsellorId?: string | null
    scheduledAt: string
    notes?: string
    source?: 'chat' | 'portal'
  },
): Promise<BookingListItem> {
  if (user.role === 'student' && !user.emailVerified) {
    const error = new Error('Please verify your email before booking a counsellor session')
    Object.assign(error, { statusCode: 403, code: 'EMAIL_NOT_VERIFIED' })
    throw error
  }

  const bookingTarget = await resolveBookingTarget(user, data)
  const booking = await repo.createBooking({
    studentId: bookingTarget.studentId,
    leadId: bookingTarget.leadId,
    counsellorId: bookingTarget.counsellorId,
    scheduledAt: new Date(data.scheduledAt),
    notes: data.notes,
    source: data.source,
    status: bookingTarget.counsellorId ? 'assigned' : 'awaiting_assignment',
  })

  // Trigger AI summary generation for counsellor handoff
  if (bookingTarget.studentId || bookingTarget.leadId) {
    getAiProcessingQueue().add('booking-summary', {
      entityType: bookingTarget.studentId ? 'student' : 'lead',
      entityId: (bookingTarget.studentId || bookingTarget.leadId)!,
      sourceType: 'booking',
      sourceId: booking.id,
    }).catch((err) => console.error('[bookings] Failed to enqueue booking summary:', err))
  }

  // Notify admin about new booking awaiting assignment
  if (!bookingTarget.counsellorId) {
    getNotificationsQueue().add('booking-awaiting-assignment', {
      recipientId: 'admin-team',
      channel: 'email',
      templateKey: 'booking_created',
      data: {
        studentId: bookingTarget.studentId || null,
        leadId: bookingTarget.leadId || null,
        scheduledAt: data.scheduledAt,
        triggeringActionId: booking.id,
        status: 'awaiting_assignment',
      },
    }).catch((err) => console.error('[bookings] Failed to enqueue admin notification:', err))
  }

  // If counsellor is already assigned, notify them directly
  if (bookingTarget.counsellorId) {
    getNotificationsQueue().add('booking-created', {
      recipientId: bookingTarget.counsellorId,
      channel: 'email',
      templateKey: 'booking_created',
      data: {
        studentId: bookingTarget.studentId || null,
        leadId: bookingTarget.leadId || null,
        scheduledAt: data.scheduledAt,
        triggeringActionId: booking.id,
      },
    }).catch((err) => console.error('[bookings] Failed to enqueue booking notification:', err))
  }

  return mapBooking(booking)
}

async function resolveBookingTarget(
  user: RequestUser,
  data: {
    studentId?: string
    leadId?: string
    counsellorId?: string | null
  },
) {
  if (user.role !== 'student') {
    if (user.role === 'counsellor') {
      if (data.studentId) {
        const student = await repo.findStudentAccess(data.studentId)
        if (!student || student.assignedCounsellorId !== user.id) {
          const error = new Error('Student not found')
          Object.assign(error, { statusCode: 404, code: 'STUDENT_NOT_FOUND' })
          throw error
        }
      }
      if (data.leadId) {
        const lead = await repo.findLeadAccess(data.leadId)
        if (!lead || lead.assignedCounsellorId !== user.id) {
          const error = new Error('Lead not found')
          Object.assign(error, { statusCode: 404, code: 'LEAD_NOT_FOUND' })
          throw error
        }
      }
    }

    return {
      studentId: data.studentId,
      leadId: data.leadId,
      counsellorId: user.role === 'counsellor' ? user.id : data.counsellorId ?? null,
    }
  }

  const student = await repo.findStudentByUserId(user.id)
  if (!student) {
    const error = new Error('Student profile not found')
    Object.assign(error, { statusCode: 404, code: 'STUDENT_NOT_FOUND' })
    throw error
  }

  return {
    studentId: student.id,
    leadId: undefined,
    counsellorId: student.assignedCounsellorId ?? null,
  }
}

export async function updateBooking(
  id: string,
  data: { status?: string; counsellorId?: string | null; notes?: string; scheduledAt?: string },
  user: RequestUser,
): Promise<BookingListItem | null> {
  const existing = await repo.findBookingById(id)
  if (!existing) return null
  if (user.role === 'counsellor' && existing.counsellorId !== user.id) return null
  if (user.role === 'student') return null

  const booking = await repo.updateBooking(id, {
    status: data.status ?? (data.counsellorId ? 'assigned' : undefined),
    counsellorId: data.counsellorId,
    notes: data.notes,
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
  })

  if (data.counsellorId && existing.counsellorId !== data.counsellorId) {
    getNotificationsQueue().add('booking-assigned', {
      recipientId: data.counsellorId,
      channel: 'email',
      templateKey: 'booking_created',
      data: {
        studentId: booking.studentId,
        leadId: booking.leadId,
        scheduledAt: booking.scheduledAt.toISOString(),
        triggeringActionId: booking.id,
        status: booking.status,
      },
    }).catch((err) => console.error('[bookings] Failed to enqueue assignment notification:', err))
  }

  return mapBooking(booking)
}
