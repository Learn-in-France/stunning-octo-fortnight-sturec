import prisma from '../../lib/prisma.js'
import type { Prisma, LeadStatus } from '@prisma/client'

export function findLeads(args: {
  skip: number
  take: number
  orderBy: Record<string, 'asc' | 'desc'>
  where?: Prisma.LeadWhereInput
}) {
  return prisma.lead.findMany({
    where: { ...args.where, deletedAt: null },
    skip: args.skip,
    take: args.take,
    orderBy: args.orderBy,
  })
}

export function countLeads(where?: Prisma.LeadWhereInput) {
  return prisma.lead.count({ where: { ...where, deletedAt: null } })
}

export function findLeadById(id: string) {
  return prisma.lead.findFirst({ where: { id, deletedAt: null } })
}

export function findLeadWithAssessment(id: string) {
  return prisma.lead.findFirst({
    where: { id, deletedAt: null },
    include: {
      latestAiAssessment: true,
    },
  })
}

export function createLead(data: Prisma.LeadUncheckedCreateInput) {
  return prisma.lead.create({ data })
}

export function updateLead(id: string, data: Prisma.LeadUncheckedUpdateInput) {
  return prisma.lead.update({ where: { id }, data })
}

export function findLeadActivities(leadId: string, args: { skip: number; take: number }) {
  return prisma.counsellorActivityLog.findMany({
    where: { leadId },
    skip: args.skip,
    take: args.take,
    orderBy: { createdAt: 'desc' },
    include: {
      createdByUser: { select: { id: true, firstName: true, lastName: true } },
    },
  })
}

export function countLeadActivities(leadId: string) {
  return prisma.counsellorActivityLog.count({ where: { leadId } })
}

export function createLeadActivity(data: Prisma.CounsellorActivityLogUncheckedCreateInput) {
  return prisma.counsellorActivityLog.create({
    data,
    include: {
      createdByUser: { select: { id: true, firstName: true, lastName: true } },
    },
  })
}

export function findLeadAssessments(leadId: string) {
  return prisma.aiAssessment.findMany({
    where: { leadId },
    orderBy: { createdAt: 'desc' },
  })
}

export function findLeadAssessmentById(leadId: string, assessmentId: string) {
  return prisma.aiAssessment.findFirst({
    where: { id: assessmentId, leadId },
  })
}

export function buildLeadWhere(filters: {
  status?: string
  source?: string
  assignedCounsellorId?: string
  qualificationMin?: number
  qualificationMax?: number
  priorityLevel?: string
  readyForAssignment?: boolean
  search?: string
  counsellorIdScope?: string
}): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {}

  if (filters.status) where.status = filters.status as LeadStatus
  if (filters.source) where.source = filters.source as any
  if (filters.assignedCounsellorId) where.assignedCounsellorId = filters.assignedCounsellorId
  if (filters.priorityLevel) where.priorityLevel = filters.priorityLevel as any
  if (filters.readyForAssignment) where.assignedCounsellorId = null
  if (filters.qualificationMin) where.qualificationScore = { gte: filters.qualificationMin }
  if (filters.qualificationMax) {
    where.qualificationScore = {
      ...(where.qualificationScore as any || {}),
      lte: filters.qualificationMax,
    }
  }
  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ]
  }
  // Counsellor scope: only see assigned leads
  if (filters.counsellorIdScope) {
    where.assignedCounsellorId = filters.counsellorIdScope
  }

  return where
}
