import type { BookingListItem } from '@sturec/shared'
import type { RequestUser } from '../../middleware/auth.js'

import * as repo from './repository.js'
import { mapBooking } from '../../lib/mappers/index.js'
import { getNotificationsQueue } from '../../lib/queue/index.js'

export async function listBookings(user: RequestUser): Promise<BookingListItem[]> {
  let where = {}

  if (user.role === 'student') {
    // Students see bookings linked to their student record
    // The student ID needs to be resolved from the user ID
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
    counsellorId: string
    scheduledAt: string
    notes?: string
  },
): Promise<BookingListItem> {
  const booking = await repo.createBooking({
    ...data,
    scheduledAt: new Date(data.scheduledAt),
  })

  // Notify the counsellor about the new booking
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
