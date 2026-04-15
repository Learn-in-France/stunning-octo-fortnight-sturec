import type { BookingListItem } from '@sturec/shared'
import type { RequestUser } from '../../middleware/auth.js'

import * as repo from './repository.js'
import { mapBooking } from '../../lib/mappers/index.js'
import { getNotificationsQueue, getAiProcessingQueue } from '../../lib/queue/index.js'
import { frontendUrl } from '../../lib/frontend-url.js'
import { joinFullName } from '../../lib/names.js'

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

  // Build the full notification payload (student/lead info, assessment,
  // counsellor name, deep links) so every email carries real context.
  const notificationData = await buildBookingNotificationData(booking.id)

  // Notify admin about new booking awaiting assignment
  if (!bookingTarget.counsellorId) {
    getNotificationsQueue().add('booking-awaiting-assignment', {
      recipientId: 'admin-team',
      channel: 'email',
      templateKey: 'booking_admin_awaiting_assignment',
      data: notificationData,
    }).catch((err) => console.error('[bookings] Failed to enqueue admin notification:', err))
  }

  // If counsellor is already assigned, notify them directly AND confirm to student
  if (bookingTarget.counsellorId) {
    getNotificationsQueue().add('booking-counsellor-assigned', {
      recipientId: bookingTarget.counsellorId,
      channel: 'email',
      templateKey: 'booking_counsellor_assigned',
      data: notificationData,
    }).catch((err) => console.error('[bookings] Failed to enqueue counsellor notification:', err))

    await notifyStudentBookingConfirmed(notificationData)
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

  // On counsellor assignment (or reassignment), notify the new counsellor
  // with full student context AND send the student a confirmation naming
  // the counsellor.
  if (data.counsellorId && existing.counsellorId !== data.counsellorId) {
    const notificationData = await buildBookingNotificationData(booking.id)

    getNotificationsQueue().add('booking-counsellor-assigned', {
      recipientId: data.counsellorId,
      channel: 'email',
      templateKey: 'booking_counsellor_assigned',
      data: notificationData,
    }).catch((err) => console.error('[bookings] Failed to enqueue assignment notification:', err))

    await notifyStudentBookingConfirmed(notificationData)
  }

  return mapBooking(booking)
}

// ─── Notification payload builder ─────────────────────────────

/**
 * Resolve everything the booking email templates care about in one go —
 * student contact details, latest AI assessment summary, counsellor
 * name, scheduled time, notes, and deep links back into the internal
 * app / student portal. Returned object is flat so templates can read
 * fields without null-chasing.
 */
async function buildBookingNotificationData(
  bookingId: string,
): Promise<Record<string, unknown>> {
  const booking = await repo.findBookingContext(bookingId)
  if (!booking) {
    return { triggeringActionId: bookingId }
  }

  const scheduledAt = booking.scheduledAt.toISOString()
  const scheduledAtHuman = formatScheduledAt(booking.scheduledAt)

  // Subject = student or lead — pick whichever is set.
  const subjectKind: 'student' | 'lead' = booking.studentId ? 'student' : 'lead'

  let subjectFirstName = ''
  let subjectLastName = ''
  let subjectEmail = ''
  let subjectPhone = ''
  let subjectRecordUrl = ''
  let subjectUserId: string | null = null
  let latestAssessmentSummary = ''
  let latestPriorityLevel = ''
  let latestQualificationScore: number | null = null

  if (booking.student) {
    const u = booking.student.user
    subjectFirstName = u.firstName ?? ''
    subjectLastName = u.lastName ?? ''
    subjectEmail = u.email ?? ''
    subjectPhone = u.phone ?? ''
    subjectUserId = u.id
    subjectRecordUrl = frontendUrl(`/students/${booking.student.id}`)
    const assessment = booking.student.aiAssessments[0]
    if (assessment) {
      latestAssessmentSummary = assessment.summaryForTeam ?? ''
      latestPriorityLevel = assessment.priorityLevel ?? ''
      latestQualificationScore = assessment.qualificationScore
    }
  } else if (booking.lead) {
    subjectFirstName = booking.lead.firstName ?? ''
    subjectLastName = booking.lead.lastName ?? ''
    subjectEmail = booking.lead.email ?? ''
    subjectPhone = booking.lead.phone ?? ''
    subjectRecordUrl = frontendUrl(`/leads/${booking.lead.id}`)
    const assessment = booking.lead.aiAssessments[0]
    if (assessment) {
      latestAssessmentSummary = assessment.summaryForTeam ?? ''
      latestPriorityLevel = assessment.priorityLevel ?? ''
      latestQualificationScore = assessment.qualificationScore
    }
  }

  const counsellorFirstName = booking.counsellor?.firstName ?? ''
  const counsellorLastName = booking.counsellor?.lastName ?? ''
  const counsellorFullName = joinFullName(
    counsellorFirstName,
    counsellorLastName,
    'your counsellor',
  )

  return {
    triggeringActionId: booking.id,
    bookingId: booking.id,
    status: booking.status,
    scheduledAt: scheduledAtHuman,
    scheduledAtIso: scheduledAt,
    notes: booking.notes ?? '',
    subjectKind,
    subjectFirstName,
    subjectLastName,
    subjectFullName: joinFullName(subjectFirstName, subjectLastName, 'a new contact'),
    subjectEmail,
    subjectPhone,
    subjectRecordUrl,
    subjectUserId,
    studentId: booking.studentId,
    leadId: booking.leadId,
    counsellorId: booking.counsellorId,
    counsellorFirstName,
    counsellorLastName,
    counsellorFullName,
    assessmentSummary: latestAssessmentSummary,
    priorityLevel: latestPriorityLevel,
    qualificationScore: latestQualificationScore,
    adminQueueUrl: frontendUrl('/dashboard'),
    portalUrl: frontendUrl('/portal'),
  }
}

/**
 * Send a confirmation email to the student whose booking was just
 * assigned a counsellor. No-op for lead bookings (leads don't have a
 * user account yet) or if we couldn't resolve a user id.
 */
async function notifyStudentBookingConfirmed(
  data: Record<string, unknown>,
): Promise<void> {
  const studentUserId = data.subjectUserId
  if (typeof studentUserId !== 'string' || !studentUserId) return

  await getNotificationsQueue()
    .add('booking-student-confirmed', {
      recipientId: studentUserId,
      channel: 'email',
      templateKey: 'booking_student_confirmed',
      data,
    })
    .catch((err) =>
      console.error('[bookings] Failed to enqueue student confirmation:', err),
    )
}

function formatScheduledAt(date: Date): string {
  // e.g. "Tue, 16 Apr 2026 at 14:00 UTC"
  try {
    return date.toLocaleString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short',
    })
  } catch {
    return date.toISOString()
  }
}
