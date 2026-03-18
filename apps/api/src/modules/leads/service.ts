import type { PaginatedResponse, LeadFilterInput } from '@sturec/shared'
import type { LeadListItem, LeadDetail, AiAssessmentSummary, ActivityLogItem } from '@sturec/shared'
import type { RequestUser } from '../../middleware/auth.js'

import * as repo from './repository.js'
import { toPrismaArgs, paginate } from '../../lib/pagination.js'
import {
  mapLeadToListItem,
  mapLeadToDetail,
  mapAiAssessmentToSummary,
  mapActivityLog,
} from '../../lib/mappers/index.js'
import { getMauticSyncQueue, getNotificationsQueue, getImportsQueue, getAiProcessingQueue } from '../../lib/queue/index.js'
import { randomUUID } from 'crypto'

export async function listLeads(
  filters: LeadFilterInput,
  user: RequestUser,
): Promise<PaginatedResponse<LeadListItem>> {
  const args = toPrismaArgs(filters)
  const where = repo.buildLeadWhere({
    ...filters,
    // Counsellors only see their assigned leads
    counsellorIdScope: user.role === 'counsellor' ? user.id : undefined,
  })

  const [items, total] = await Promise.all([
    repo.findLeads({ ...args, where }),
    repo.countLeads(where),
  ])
  return paginate(items.map(mapLeadToListItem), total, filters)
}

export async function getLead(id: string): Promise<LeadDetail | null> {
  const lead = await repo.findLeadWithAssessment(id)
  if (!lead) return null
  return mapLeadToDetail(lead, lead.latestAiAssessment)
}

export async function createLead(
  data: {
    email: string
    phone?: string
    firstName: string
    lastName?: string
    source: string
    sourcePartner?: string
    notes?: string
  },
  userId: string,
) {
  const lead = await repo.createLead({
    ...data,
    source: data.source as any,
    status: 'new_lead',
    createdByUserId: userId,
  })

  // Sync new lead to Mautic
  getMauticSyncQueue().add('lead-created', {
    entityType: 'lead',
    entityId: lead.id,
    eventType: 'contact_created',
    triggeringActionId: lead.id,
  }).catch((err) => console.error('[leads] Failed to enqueue Mautic sync:', err))

  // Trigger AI assessment + routing for the new lead
  getAiProcessingQueue().add('form-submission-assessment', {
    entityType: 'lead',
    entityId: lead.id,
    sourceType: 'form_submission',
    sourceId: lead.id,
  }).catch((err) => console.error('[leads] Failed to enqueue AI assessment:', err))

  return mapLeadToListItem(lead)
}

export async function updateLead(id: string, data: Record<string, unknown>) {
  const lead = await repo.updateLead(id, data)
  return mapLeadToListItem(lead)
}

export async function assignLead(id: string, counsellorId: string) {
  const lead = await repo.updateLead(id, { assignedCounsellorId: counsellorId })

  // Notify the counsellor about new assignment
  getNotificationsQueue().add('lead-assigned', {
    recipientId: counsellorId,
    channel: 'email',
    templateKey: 'lead_assigned',
    data: {
      leadId: id,
      leadEmail: lead.email,
      leadName: `${lead.firstName} ${lead.lastName || ''}`.trim(),
      triggeringActionId: id,
    },
  }).catch((err) => console.error('[leads] Failed to enqueue assignment notification:', err))

  return mapLeadToListItem(lead)
}

export async function disqualifyLead(id: string, reason: string) {
  const lead = await repo.updateLead(id, {
    status: 'disqualified',
    notes: reason,
  })
  return mapLeadToListItem(lead)
}

export async function convertLead(id: string) {
  const lead = await repo.findLeadById(id)
  if (!lead) return { error: 'Lead not found', code: 'LEAD_NOT_FOUND' }

  if (lead.convertedStudentId) {
    return { action: 'already_converted' as const, student: undefined }
  }

  if (!lead.userId) {
    return { action: 'requires_user_account' as const, student: undefined }
  }

  // Check if student already exists for this user
  const { default: prisma } = await import('../../lib/prisma.js')
  const existingStudent = await prisma.student.findFirst({
    where: { userId: lead.userId, deletedAt: null },
  })

  if (existingStudent) {
    // Link lead to existing student
    await repo.updateLead(id, {
      status: 'converted',
      convertedStudentId: existingStudent.id,
    })
    return { action: 'linked' as const }
  }

  // Create new student
  const student = await prisma.student.create({
    data: {
      userId: lead.userId,
      referenceCode: `STU-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
      source: lead.source as string,
      sourcePartner: lead.sourcePartner,
      stage: 'lead_created',
      stageUpdatedAt: new Date(),
    },
  })

  await repo.updateLead(id, {
    status: 'converted',
    convertedStudentId: student.id,
  })

  // Sync conversion to Mautic
  getMauticSyncQueue().add('lead-converted', {
    entityType: 'student',
    entityId: student.id,
    eventType: 'contact_created',
    triggeringActionId: id,
  }).catch((err) => console.error('[leads] Failed to enqueue conversion sync:', err))

  // Trigger AI assessment for the new student (carries over lead data)
  getAiProcessingQueue().add('conversion-assessment', {
    entityType: 'student',
    entityId: student.id,
    sourceType: 'manual_review',
    sourceId: id,
  }).catch((err) => console.error('[leads] Failed to enqueue conversion assessment:', err))

  return { action: 'created' as const }
}

// ─── Activities ───────────────────────────────────────────────

export async function listLeadActivities(
  leadId: string,
  pagination: { page: number; limit: number },
): Promise<PaginatedResponse<ActivityLogItem>> {
  const skip = (pagination.page - 1) * pagination.limit
  const [items, total] = await Promise.all([
    repo.findLeadActivities(leadId, { skip, take: pagination.limit }),
    repo.countLeadActivities(leadId),
  ])
  return paginate(
    items.map((a) => mapActivityLog(a, a.createdByUser)),
    total,
    { ...pagination, sortBy: 'created_at', sortOrder: 'desc' },
  )
}

export async function createLeadActivity(
  leadId: string,
  data: {
    activityType: string
    channel: string
    direction: string
    outcome?: string
    summary?: string
    nextActionDueAt?: string
    durationMinutes?: number
  },
  userId: string,
) {
  // Look up lead to find assigned counsellor
  const lead = await repo.findLeadById(leadId)
  if (!lead) return null

  const activity = await repo.createLeadActivity({
    leadId,
    counsellorId: lead.assignedCounsellorId || userId,
    createdByUserId: userId,
    activityType: data.activityType as any,
    channel: data.channel as any,
    direction: data.direction as any,
    outcome: data.outcome,
    summary: data.summary,
    nextActionDueAt: data.nextActionDueAt ? new Date(data.nextActionDueAt) : undefined,
    durationMinutes: data.durationMinutes,
  })

  return mapActivityLog(activity, activity.createdByUser)
}

// ─── AI Assessments ───────────────────────────────────────────

export async function listLeadAssessments(leadId: string): Promise<AiAssessmentSummary[]> {
  const assessments = await repo.findLeadAssessments(leadId)
  return assessments.map(mapAiAssessmentToSummary)
}

export async function getLeadAssessment(
  leadId: string,
  assessmentId: string,
): Promise<AiAssessmentSummary | null> {
  const assessment = await repo.findLeadAssessmentById(leadId, assessmentId)
  if (!assessment) return null
  return mapAiAssessmentToSummary(assessment)
}

// ─── Import ──────────────────────────────────────────────────

export async function importLeads(rows: Record<string, unknown>[]) {
  const batchId = randomUUID()

  await getImportsQueue().add(`import-${batchId}`, {
    batchId,
    rows,
  })

  return { batchId, rowCount: rows.length, status: 'queued' as const }
}
