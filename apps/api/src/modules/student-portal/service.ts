import type {
  StudentOwnProfile,
  StudentProgress,
  ApplicationListItem,
  DocumentListItem,
  DocumentRequirementItem,
  BookingListItem,
  NotificationItem,
  SupportRequestResponse,
} from '@sturec/shared'

import * as repo from './repository.js'
import {
  mapStudentToOwnProfile,
  mapApplication,
  mapDocument,
  mapDocumentRequirement,
  mapBooking,
  mapNotification,
} from '../../lib/mappers/index.js'
import { getNotificationsQueue } from '../../lib/queue/index.js'
import { deriveCumulativeIntakeCapture } from '../../lib/intake.js'

// ─── Stage helpers ──────────────────────────────────────────

const STAGE_ORDER = [
  'lead_created',
  'intake_completed',
  'qualified',
  'counsellor_consultation',
  'application_started',
  'offer_confirmed',
  'campus_france_readiness',
  'visa_file_readiness',
  'visa_submitted',
  'visa_decision',
  'arrival_onboarding',
  'arrived_france',
  'alumni',
]

const STAGE_LABELS: Record<string, string> = {
  lead_created: 'Account created',
  intake_completed: 'AI intake completed',
  qualified: 'Profile qualified',
  counsellor_consultation: 'Counsellor consultation',
  application_started: 'Application started',
  offer_confirmed: 'Offer confirmed',
  campus_france_readiness: 'Campus France ready',
  visa_file_readiness: 'Visa file ready',
  visa_submitted: 'Visa submitted',
  visa_decision: 'Visa decision received',
  arrival_onboarding: 'Arrival onboarding',
  arrived_france: 'Arrived in France',
  alumni: 'Alumni',
}

const NEXT_ACTIONS: Record<string, string[]> = {
  lead_created: ['Complete AI intake conversation'],
  intake_completed: ['Wait for qualification review'],
  qualified: ['Schedule counsellor consultation'],
  counsellor_consultation: ['Complete consultation call', 'Upload required documents', 'Start applications'],
  application_started: ['Submit pending applications', 'Upload remaining documents'],
  offer_confirmed: ['Accept offer', 'Prepare Campus France dossier'],
  campus_france_readiness: ['Complete Campus France interview', 'Prepare visa file'],
  visa_file_readiness: ['Submit visa application'],
  visa_submitted: ['Await visa decision'],
  visa_decision: ['Complete pre-departure checklist'],
  arrival_onboarding: ['Arrive and check in'],
  arrived_france: ['Complete onboarding steps'],
  alumni: [],
}

function visaStatusFromStage(stage: string): string | null {
  const visaStages: Record<string, string> = {
    visa_file_readiness: 'preparing_file',
    visa_submitted: 'submitted',
    visa_decision: 'decision_received',
    arrival_onboarding: 'approved',
    arrived_france: 'approved',
    alumni: 'approved',
  }
  return visaStages[stage] || null
}

// ─── Profile ────────────────────────────────────────────────

export async function getOwnProfile(userId: string): Promise<StudentOwnProfile | null> {
  const student = await repo.findStudentByUserId(userId)
  if (!student) return null
  return mapStudentToOwnProfile(student)
}

// ─── Progress ───────────────────────────────────────────────

export async function getProgress(userId: string): Promise<StudentProgress | null> {
  const student = await repo.findStudentByUserId(userId)
  if (!student) return null

  const lead = await repo.findLeadByUserId(userId)

  const [docsByStatus, totalReqs, appsByStatus, assessments] = await Promise.all([
    repo.countStudentDocumentsByStatus(student.id),
    repo.countStudentRequirements(student.id),
    repo.countStudentApplicationsByStatus(student.id),
    repo.findAssessments(student.id, lead?.id),
  ])

  const stageIndex = STAGE_ORDER.indexOf(student.stage)
  const progressPercent = stageIndex >= 0
    ? Math.round((stageIndex / (STAGE_ORDER.length - 1)) * 100)
    : 0

  const completedMilestones = STAGE_ORDER
    .slice(0, stageIndex + 1)
    .map((s) => STAGE_LABELS[s] || s)

  const nextActions = NEXT_ACTIONS[student.stage] || []

  const verifiedDocs = docsByStatus.find((g) => g.status === 'verified')?._count || 0

  const appMap = Object.fromEntries(
    appsByStatus.map((g) => [g.status, g._count]),
  ) as Record<string, number>
  const totalApps = Object.values(appMap).reduce((s, c) => s + c, 0)

  const intakeCapture = deriveCumulativeIntakeCapture(assessments)

  return {
    stage: student.stage,
    progressPercent,
    assignedCounsellorId: student.assignedCounsellorId,
    bookingReady: intakeCapture.bookingReady,
    intakeCapture: {
      captured: intakeCapture.capturedFields.length,
      total: 7,
      missing: intakeCapture.missingFields.map((field) => field.replace(/_/g, ' ')),
    },

    completedMilestones,
    nextActions,
    documentChecklist: { completed: verifiedDocs, total: totalReqs },
    applications: { total: totalApps, offers: appMap['offer'] || 0 },
    visa: { status: visaStatusFromStage(student.stage) },
  }
}

// ─── Profile Update ─────────────────────────────────────────

export async function updateOwnProfile(
  userId: string,
  data: Record<string, unknown>,
): Promise<StudentOwnProfile | null> {
  const student = await repo.findStudentByUserId(userId)
  if (!student) return null
  await repo.updateStudentProfile(student.id, data)
  // Re-fetch to get updated data
  const updated = await repo.findStudentByUserId(userId)
  if (!updated) return null
  return mapStudentToOwnProfile(updated)
}

// ─── Notification Preferences ───────────────────────────────

export async function getNotificationPreferences(userId: string) {
  const student = await repo.findStudentByUserId(userId)
  if (!student) return null
  return repo.getNotificationPreferences(student.id)
}

export async function updateNotificationPreferences(
  userId: string,
  data: { whatsappConsent?: boolean; emailConsent?: boolean },
) {
  const student = await repo.findStudentByUserId(userId)
  if (!student) return null
  return repo.updateNotificationPreferences(student.id, data)
}

// ─── Support ────────────────────────────────────────────────

export async function submitSupportRequest(
  userId: string,
  data: { subject: string; message: string; category: string },
): Promise<SupportRequestResponse | null> {
  const student = await repo.findStudentByUserId(userId)
  if (!student) return null

  const entry = await repo.createSupportEntry({
    studentId: student.id,
    subject: data.subject,
    message: data.message,
    category: data.category,
  })

  // Notify support team via email
  getNotificationsQueue().add('support-request', {
    recipientId: 'support-team',
    channel: 'email',
    templateKey: 'support_request',
    data: {
      studentId: student.id,
      subject: data.subject,
      message: data.message,
      category: data.category,
      notificationLogId: entry.id,
    },
  }).catch((err) => console.error('[student-portal] Failed to enqueue support notification:', err))

  return {
    id: entry.id,
    status: 'received',
    message: 'Your support request has been submitted. We will get back to you shortly.',
  }
}

// ─── Applications ───────────────────────────────────────────

export async function getApplications(userId: string): Promise<ApplicationListItem[] | null> {
  const student = await repo.findStudentByUserId(userId)
  if (!student) return null
  const apps = await repo.findStudentApplications(student.id)
  return apps.map((a) => mapApplication(a, a.program, a.intake))
}

export async function getApplicationDetail(
  userId: string,
  applicationId: string,
): Promise<ApplicationListItem | null> {
  const student = await repo.findStudentByUserId(userId)
  if (!student) return null
  const app = await repo.findStudentApplicationById(student.id, applicationId)
  if (!app) return null
  return mapApplication(app, app.program, app.intake)
}

// ─── Documents ──────────────────────────────────────────────

export async function getDocuments(userId: string): Promise<DocumentListItem[] | null> {
  const student = await repo.findStudentByUserId(userId)
  if (!student) return null
  const docs = await repo.findStudentDocuments(student.id)
  return docs.map(mapDocument)
}

export async function shareDocument(userId: string, documentId: string): Promise<DocumentListItem | null> {
  const student = await repo.findStudentByUserId(userId)
  if (!student) return null
  if (!student.assignedCounsellorId) return null

  const { shareDocument: share } = await import('../documents/service.js')
  return share(documentId, student.id, student.assignedCounsellorId)
}

export async function revokeDocument(userId: string, documentId: string): Promise<DocumentListItem | null> {
  const student = await repo.findStudentByUserId(userId)
  if (!student) return null

  const { revokeDocument: revoke } = await import('../documents/service.js')
  return revoke(documentId, student.id)
}

// ─── Requirements ───────────────────────────────────────────

export async function getRequirements(userId: string): Promise<DocumentRequirementItem[] | null> {
  const student = await repo.findStudentByUserId(userId)
  if (!student) return null
  const reqs = await repo.findStudentRequirements(student.id)
  return reqs.map(mapDocumentRequirement)
}

// ─── Bookings ───────────────────────────────────────────────

export async function getBookings(userId: string): Promise<BookingListItem[] | null> {
  const student = await repo.findStudentByUserId(userId)
  if (!student) return null
  const bookings = await repo.findStudentBookings(student.id)
  return bookings.map(mapBooking)
}

// ─── Notifications ──────────────────────────────────────────

export async function getNotifications(userId: string): Promise<NotificationItem[] | null> {
  const student = await repo.findStudentByUserId(userId)
  if (!student) return null
  const notifications = await repo.findStudentNotifications(student.id)
  return notifications.map(mapNotification)
}
