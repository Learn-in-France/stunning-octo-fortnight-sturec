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
  data: {
    studentId?: string
    leadId?: string
    counsellorId?: string | null
    scheduledAt: string
    notes?: string
    source?: 'chat' | 'portal'
  },
): Promise<BookingListItem> {
  const booking = await repo.createBooking({
    studentId: data.studentId,
    leadId: data.leadId,
    counsellorId: data.counsellorId ?? null,
    scheduledAt: new Date(data.scheduledAt),
    notes: data.notes,
    status: data.counsellorId ? 'assigned' : 'awaiting_assignment',
  })

  // Trigger AI summary generation for counsellor handoff
  if (data.studentId || data.leadId) {
    getAiProcessingQueue().add('booking-summary', {
      entityType: data.studentId ? 'student' : 'lead',
      entityId: data.studentId || data.leadId,
      sourceType: 'booking',
      sourceId: booking.id,
    }).catch((err) => console.error('[bookings] Failed to enqueue booking summary:', err))
  }

  // Notify admin about new booking awaiting assignment
  if (!data.counsellorId) {
    getNotificationsQueue().add('booking-awaiting-assignment', {
      recipientId: 'admin-team',
      channel: 'email',
      templateKey: 'booking_created',
      data: {
        studentId: data.studentId || null,
        leadId: data.leadId || null,
        scheduledAt: data.scheduledAt,
        triggeringActionId: booking.id,
        status: 'awaiting_assignment',
      },
    }).catch((err) => console.error('[bookings] Failed to enqueue admin notification:', err))
  }

  // If counsellor is already assigned, notify them directly
  if (data.counsellorId) {
    getNotificationsQueue().add('booking-created', {
      recipientId: data.counsellorId,
      channel: 'email',
      templateKey: 'booking_created',
      data: {
        studentId: data.studentId || null,
        leadId: data.leadId || null,
        scheduledAt: data.scheduledAt,
        triggeringActionId: booking.id,
      },
    }).catch((err) => console.error('[bookings] Failed to enqueue booking notification:', err))
  }

  return mapBooking(booking)
}

export async function updateBooking(
  id: string,
  data: { status?: string; notes?: string; scheduledAt?: string },
): Promise<BookingListItem | null> {
  const existing = await repo.findBookingById(id)
  if (!existing) return null

  const booking = await repo.updateBooking(id, {
    status: data.status,
    notes: data.notes,
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
  })
  return mapBooking(booking)
}
