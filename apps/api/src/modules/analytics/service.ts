import type {
  AnalyticsOverview,
  PipelineMetrics,
  CounsellorAnalyticsItem,
  CounsellorAnalyticsDetail,
  StudentAnalyticsItem,
  StudentAnalyticsDetail,
  BookingListItem,
} from '@sturec/shared'

import { mapActivityChannel, mapBooking } from '../../lib/mappers/index.js'
import * as repo from './repository.js'

function defaultPeriod(from?: string, to?: string) {
  const now = new Date()
  const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  return {
    from: from || defaultFrom.toISOString().split('T')[0],
    to: to || now.toISOString().split('T')[0],
  }
}

export async function getOverview(from?: string, to?: string): Promise<AnalyticsOverview> {
  const period = defaultPeriod(from, to)

  const [
    leadsByStatus,
    totalLeads,
    studentsByStage,
    totalStudents,
    appsByStatus,
    docsByStatus,
    bookingsByStatus,
  ] = await Promise.all([
    repo.countLeadsByStatus(),
    repo.countLeads(),
    repo.countStudentsByStage(),
    repo.countStudents(),
    repo.countApplicationsByStatus(),
    repo.countDocumentsByStatus(),
    repo.countBookingsByStatus(),
  ])

  const leadCounts = Object.fromEntries(
    leadsByStatus.map((g) => [g.status, g._count]),
  ) as Record<string, number>

  const appCounts = Object.fromEntries(
    appsByStatus.map((g) => [g.status, g._count]),
  ) as Record<string, number>

  const docCounts = Object.fromEntries(
    docsByStatus.map((g) => [g.status, g._count]),
  ) as Record<string, number>

  const bookingCounts = Object.fromEntries(
    bookingsByStatus.map((g) => [g.status, g._count]),
  ) as Record<string, number>

  const byStage = Object.fromEntries(
    studentsByStage.map((g) => [g.stage, g._count]),
  )

  // Active = not alumni, not lead_created
  const inactiveStages = new Set(['lead_created', 'alumni'])
  const activeStudents = studentsByStage
    .filter((g) => !inactiveStages.has(g.stage))
    .reduce((sum, g) => sum + g._count, 0)

  return {
    period,
    data: {
      leads: {
        total: totalLeads,
        new: leadCounts['new_lead'] || 0,
        qualified: leadCounts['qualified'] || 0,
        converted: leadCounts['converted'] || 0,
        disqualified: leadCounts['disqualified'] || 0,
      },
      students: {
        total: totalStudents,
        active: activeStudents,
        byStage,
      },
      applications: {
        total: Object.values(appCounts).reduce((s, c) => s + c, 0),
        submitted: appCounts['submitted'] || 0,
        offers: appCounts['offer'] || 0,
        enrolled: appCounts['enrolled'] || 0,
      },
      documents: {
        pending: (docCounts['pending'] || 0) + (docCounts['pending_upload'] || 0),
        verified: docCounts['verified'] || 0,
        rejected: docCounts['rejected'] || 0,
      },
      bookings: {
        scheduled: bookingCounts['scheduled'] || 0,
        completed: bookingCounts['completed'] || 0,
        awaitingAssignment: bookingCounts['awaiting_assignment'] || 0,
        assigned: bookingCounts['assigned'] || 0,
      },
    },
  }
}

export async function getCounsellorOverview(counsellorId: string, from?: string, to?: string): Promise<AnalyticsOverview> {
  const period = defaultPeriod(from, to)

  const [
    leadsByStatus,
    totalLeads,
    studentsByStage,
    totalStudents,
    appsByStatus,
    docsByStatus,
    bookingsByStatus,
  ] = await Promise.all([
    repo.countLeadsByStatusForCounsellor(counsellorId),
    repo.countLeadsForCounsellor(counsellorId),
    repo.countCounsellorStudentsByStage(counsellorId),
    repo.countAssignedStudents(counsellorId),
    repo.countApplicationsByStatusForCounsellor(counsellorId),
    repo.countDocumentsByStatusForCounsellor(counsellorId),
    repo.countBookingsByStatusForCounsellor(counsellorId),
  ])

  const leadCounts = Object.fromEntries(
    leadsByStatus.map((g) => [g.status, g._count]),
  ) as Record<string, number>

  const appCounts = Object.fromEntries(
    appsByStatus.map((g) => [g.status, g._count]),
  ) as Record<string, number>

  const docCounts = Object.fromEntries(
    docsByStatus.map((g) => [g.status, g._count]),
  ) as Record<string, number>

  const bookingCounts = Object.fromEntries(
    bookingsByStatus.map((g) => [g.status, g._count]),
  ) as Record<string, number>

  const byStage = Object.fromEntries(
    studentsByStage.map((g) => [g.stage, g._count]),
  )

  const inactiveStages = new Set(['lead_created', 'alumni'])
  const activeStudents = studentsByStage
    .filter((g) => !inactiveStages.has(g.stage))
    .reduce((sum, g) => sum + g._count, 0)

  return {
    period,
    data: {
      leads: {
        total: totalLeads,
        new: leadCounts['new_lead'] || 0,
        qualified: leadCounts['qualified'] || 0,
        converted: leadCounts['converted'] || 0,
        disqualified: leadCounts['disqualified'] || 0,
      },
      students: {
        total: totalStudents,
        active: activeStudents,
        byStage,
      },
      applications: {
        total: Object.values(appCounts).reduce((s, c) => s + c, 0),
        submitted: appCounts['submitted'] || 0,
        offers: appCounts['offer'] || 0,
        enrolled: appCounts['enrolled'] || 0,
      },
      documents: {
        pending: (docCounts['pending'] || 0) + (docCounts['pending_upload'] || 0),
        verified: docCounts['verified'] || 0,
        rejected: docCounts['rejected'] || 0,
      },
      bookings: {
        scheduled: bookingCounts['scheduled'] || 0,
        completed: bookingCounts['completed'] || 0,
        awaitingAssignment: bookingCounts['awaiting_assignment'] || 0,
        assigned: bookingCounts['assigned'] || 0,
      },
    },
  }
}

export async function getPendingAssignments(): Promise<BookingListItem[]> {
  const bookings = await repo.findPendingAssignments()
  return bookings.map(mapBooking)
}

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

async function computeAverageDaysInStage(): Promise<Record<string, number>> {
  const transitions = await repo.findAllStageTransitions() ?? []

  // Group transitions by studentId
  const byStudent = new Map<string, Array<{ toStage: string; timestamp: Date }>>()
  for (const t of transitions) {
    let list = byStudent.get(t.studentId)
    if (!list) {
      list = []
      byStudent.set(t.studentId, list)
    }
    list.push(t)
  }

  // For each student, calculate days between consecutive transitions
  const stageDurations = new Map<string, number[]>()
  for (const studentTransitions of byStudent.values()) {
    for (let i = 0; i < studentTransitions.length; i++) {
      const nextTimestamp = studentTransitions[i + 1]?.timestamp ?? new Date()
      const days = Math.floor(
        (nextTimestamp.getTime() - studentTransitions[i].timestamp.getTime()) / (1000 * 60 * 60 * 24),
      )
      const stage = studentTransitions[i].toStage
      let durations = stageDurations.get(stage)
      if (!durations) {
        durations = []
        stageDurations.set(stage, durations)
      }
      durations.push(days)
    }
  }

  // Compute average for each stage
  const result: Record<string, number> = {}
  for (const stage of STAGE_ORDER) {
    const durations = stageDurations.get(stage)
    if (durations && durations.length > 0) {
      const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length
      result[stage] = Math.round(avg * 100) / 100
    }
  }

  return result
}

export async function getPipeline(from?: string, to?: string): Promise<PipelineMetrics> {
  const period = defaultPeriod(from, to)

  const studentsByStage = await repo.countStudentsByStage()

  const stageMap = Object.fromEntries(
    studentsByStage.map((g) => [g.stage, g._count]),
  ) as Record<string, number>

  const funnel = STAGE_ORDER.map((stage) => ({
    stage,
    count: stageMap[stage] || 0,
  }))

  const totalStart = stageMap['lead_created'] || 0
  const totalEnd = (stageMap['arrived_france'] || 0) + (stageMap['alumni'] || 0)
  const conversionRate = totalStart > 0 ? Math.round((totalEnd / totalStart) * 100) / 100 : null

  return {
    period,
    data: {
      funnel,
      conversionRate,
      averageDaysInStage: await computeAverageDaysInStage()
    },
  }
}

// ─── Counsellor Analytics ─────────────────────────────────────

export async function listCounsellors(): Promise<CounsellorAnalyticsItem[]> {
  const counsellors = await repo.findCounsellors()

  const items = await Promise.all(
    counsellors.map(async (c) => {
      const [assignedLeads, assignedStudents, activityCount, convertedLeads, overdueActions] =
        await Promise.all([
          repo.countAssignedLeads(c.id),
          repo.countAssignedStudents(c.id),
          repo.countCounsellorActivities(c.id),
          repo.countConvertedLeads(c.id),
          repo.countOverdueActions(c.id),
        ])

      const totalLeads = assignedLeads + convertedLeads
      const conversionRate = totalLeads > 0
        ? Math.round((convertedLeads / totalLeads) * 100) / 100
        : null

      return {
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        assignedLeads,
        assignedStudents,
        activityCount,
        conversionRate,
        overdueActions,
      }
    }),
  )

  return items
}

export async function getCounsellorDetail(
  id: string,
  from?: string,
  to?: string,
): Promise<CounsellorAnalyticsDetail | null> {
  const period = defaultPeriod(from, to)
  const counsellor = await repo.findCounsellorById(id)
  if (!counsellor) return null

  const [leads, students, activitiesByType, activitiesByChannel, recentActivities, studentStages] =
    await Promise.all([
      repo.countAssignedLeads(id),
      repo.countAssignedStudents(id),
      repo.findCounsellorActivitiesByType(id),
      repo.findCounsellorActivitiesByChannel(id),
      repo.findRecentCounsellorActivities(id),
      repo.countCounsellorStudentsByStage(id),
    ])

  const activityByType = Object.fromEntries(
    activitiesByType.map((g) => [g.activityType, g._count]),
  ) as Record<string, number>

  const activityByChannel = Object.fromEntries(
    activitiesByChannel.map((g) => [mapActivityChannel(g.channel), g._count]),
  ) as Record<string, number>

  const studentStageMap = Object.fromEntries(
    studentStages.map((g) => [g.stage, g._count]),
  ) as Record<string, number>

  return {
    id: counsellor.id,
    name: `${counsellor.firstName} ${counsellor.lastName}`,
    email: counsellor.email,
    period,
    caseload: { leads, students },
    activityByType,
    activityByChannel,
    recentActivities: recentActivities.map((a) => ({
      id: a.id,
      activityType: a.activityType,
      channel: a.channel,
      summary: a.summary,
      createdAt: a.createdAt.toISOString(),
    })),
    studentStages: studentStageMap,
  }
}

// ─── Student Analytics ────────────────────────────────────────

function daysInStage(stageUpdatedAt: Date | null): number {
  if (!stageUpdatedAt) return 0
  return Math.floor((Date.now() - stageUpdatedAt.getTime()) / (1000 * 60 * 60 * 24))
}

export async function listStudentAnalytics(): Promise<StudentAnalyticsItem[]> {
  const students = await repo.findStudentsForAnalytics()

  const items = await Promise.all(
    students.map(async (s) => {
      const [completedDocs, totalReqs, applicationCount, lastActivity] = await Promise.all([
        repo.countStudentDocuments(s.id, 'verified'),
        repo.countStudentDocumentRequirements(s.id),
        repo.countStudentApplications(s.id),
        repo.findLastCounsellorActivity(s.id),
      ])

      return {
        id: s.id,
        referenceCode: s.referenceCode,
        firstName: s.user.firstName,
        lastName: s.user.lastName,
        stage: s.stage,
        daysInStage: daysInStage(s.stageUpdatedAt),
        documentProgress: { completed: completedDocs, total: totalReqs },
        applicationCount,
        lastCounsellorTouchpoint: lastActivity?.createdAt.toISOString() ?? null,
      }
    }),
  )

  return items
}

export async function getStudentAnalyticsDetail(
  id: string,
  from?: string,
  to?: string,
): Promise<StudentAnalyticsDetail | null> {
  const period = defaultPeriod(from, to)
  const student = await repo.findStudentForAnalytics(id)
  if (!student) return null

  const [completedDocs, totalReqs, appsByStatus, lastActivity, transitions] = await Promise.all([
    repo.countStudentDocuments(id, 'verified'),
    repo.countStudentDocumentRequirements(id),
    repo.countStudentApplicationsByStatus(id),
    repo.findLastCounsellorActivity(id),
    repo.findStudentStageTransitions(id),
  ])

  const appMap = Object.fromEntries(
    appsByStatus.map((g) => [g.status, g._count]),
  ) as Record<string, number>
  const totalApps = Object.values(appMap).reduce((s, c) => s + c, 0)

  // Build stage history from transitions
  const stageHistory = transitions.map((t, i) => {
    const nextTimestamp = transitions[i + 1]?.timestamp ?? new Date()
    const days = Math.floor(
      (nextTimestamp.getTime() - t.timestamp.getTime()) / (1000 * 60 * 60 * 24),
    )
    return {
      stage: t.toStage,
      enteredAt: t.timestamp.toISOString(),
      daysInStage: days,
    }
  })

  return {
    id: student.id,
    referenceCode: student.referenceCode,
    firstName: student.user.firstName,
    lastName: student.user.lastName,
    stage: student.stage,
    daysInStage: daysInStage(student.stageUpdatedAt),
    period,
    documentProgress: { completed: completedDocs, total: totalReqs },
    applications: {
      total: totalApps,
      offers: appMap['offer'] || 0,
      enrolled: appMap['enrolled'] || 0,
    },
    stageHistory,
    lastCounsellorTouchpoint: lastActivity?.createdAt.toISOString() ?? null,
  }
}
