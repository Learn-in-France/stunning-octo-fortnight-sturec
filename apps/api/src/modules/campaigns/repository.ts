import prisma from '../../lib/prisma.js'
import type { CampaignMode, CampaignStatus, CampaignStepStatus } from '@prisma/client'

// ─── Templates ──────────────────────────────────────────────

export function findTemplates(phaseKey?: string) {
  return prisma.campaignTemplate.findMany({
    where: { ...(phaseKey && { phaseKey }), active: true },
    orderBy: { createdAt: 'asc' },
  })
}

export function findTemplateById(id: string) {
  return prisma.campaignTemplate.findUnique({ where: { id } })
}

export function createTemplate(data: {
  name: string
  phaseKey: string
  channel: string
  deliveryMode?: string
  templateKey: string
  mauticCampaignId?: number
  subject?: string
  description?: string
  defaultDelayDays?: number
}) {
  return prisma.campaignTemplate.create({
    data: {
      name: data.name,
      phaseKey: data.phaseKey,
      channel: data.channel,
      deliveryMode: (data.deliveryMode as any) ?? 'direct_email',
      templateKey: data.templateKey,
      mauticCampaignId: data.mauticCampaignId,
      subject: data.subject,
      description: data.description,
      defaultDelayDays: data.defaultDelayDays ?? 0,
    },
  })
}

export function updateTemplate(id: string, data: Record<string, unknown>) {
  return prisma.campaignTemplate.update({ where: { id }, data: data as any })
}

// ─── Packs ──────────────────────────────────────────────────

export function findPacks(phaseKey?: string) {
  return prisma.campaignPack.findMany({
    where: { ...(phaseKey && { phaseKey }), active: true },
    include: {
      steps: {
        include: { template: true },
        orderBy: { orderIndex: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export function findPackById(id: string) {
  return prisma.campaignPack.findUnique({
    where: { id },
    include: {
      steps: {
        include: { template: true },
        orderBy: { orderIndex: 'asc' },
      },
    },
  })
}

export function createPack(data: {
  name: string
  phaseKey: string
  description?: string
  steps: Array<{ templateId: string; orderIndex: number; delayDays?: number }>
}) {
  return prisma.campaignPack.create({
    data: {
      name: data.name,
      phaseKey: data.phaseKey,
      description: data.description,
      steps: {
        create: data.steps.map((s) => ({
          templateId: s.templateId,
          orderIndex: s.orderIndex,
          delayDays: s.delayDays ?? 0,
        })),
      },
    },
    include: {
      steps: { include: { template: true }, orderBy: { orderIndex: 'asc' } },
    },
  })
}

export function updatePack(id: string, data: Record<string, unknown>) {
  return prisma.campaignPack.update({ where: { id }, data: data as any })
}

// ─── Student Campaigns ──────────────────────────────────────

export function findStudentCampaigns(studentId: string) {
  return prisma.studentCampaign.findMany({
    where: { studentId },
    include: {
      pack: { include: { steps: { orderBy: { orderIndex: 'asc' } } } },
      steps: {
        include: { template: true },
        orderBy: { orderIndex: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export function findStudentCampaignById(id: string) {
  return prisma.studentCampaign.findUnique({
    where: { id },
    include: {
      pack: { include: { steps: { orderBy: { orderIndex: 'asc' } } } },
      steps: {
        include: { template: true },
        orderBy: { orderIndex: 'asc' },
      },
    },
  })
}

export function createStudentCampaign(data: {
  studentId: string
  counsellorId: string
  packId: string
  phaseKey: string
  mode?: string
}) {
  return prisma.studentCampaign.create({
    data: {
      studentId: data.studentId,
      counsellorId: data.counsellorId,
      packId: data.packId,
      phaseKey: data.phaseKey,
      mode: (data.mode as CampaignMode) ?? 'manual',
      status: 'active',
      startedAt: new Date(),
    },
  })
}

export function updateStudentCampaign(
  id: string,
  data: { status?: string; mode?: string; pausedAt?: Date; completedAt?: Date },
) {
  return prisma.studentCampaign.update({
    where: { id },
    data: {
      ...(data.status && { status: data.status as CampaignStatus }),
      ...(data.mode && { mode: data.mode as CampaignMode }),
      ...(data.pausedAt && { pausedAt: data.pausedAt }),
      ...(data.completedAt && { completedAt: data.completedAt }),
    },
  })
}

// ─── Student Campaign Steps ─────────────────────────────────

export function createStudentCampaignSteps(
  studentCampaignId: string,
  steps: Array<{ templateId: string; orderIndex: number; scheduledFor?: Date }>,
) {
  return prisma.studentCampaignStep.createMany({
    data: steps.map((s) => ({
      studentCampaignId,
      templateId: s.templateId,
      orderIndex: s.orderIndex,
      scheduledFor: s.scheduledFor,
      status: s.scheduledFor ? 'scheduled' as CampaignStepStatus : 'pending' as CampaignStepStatus,
    })),
  })
}

export function updateStepStatus(
  id: string,
  data: { status: string; scheduledFor?: Date; sentAt?: Date; notificationLogId?: string; errorMessage?: string },
) {
  return prisma.studentCampaignStep.update({
    where: { id },
    data: {
      status: data.status as CampaignStepStatus,
      scheduledFor: data.scheduledFor,
      sentAt: data.sentAt,
      notificationLogId: data.notificationLogId,
      errorMessage: data.errorMessage,
    },
  })
}

export function findDueSteps() {
  return prisma.studentCampaignStep.findMany({
    where: {
      status: 'scheduled',
      scheduledFor: { lte: new Date() },
      studentCampaign: { status: 'active', mode: 'automated' },
    },
    include: {
      template: true,
      studentCampaign: {
        include: { student: { select: { id: true, userId: true } } },
      },
    },
    take: 50,
  })
}

export async function findStudentCampaignHistory(studentId: string) {
  // Get all campaign step execution records for this student
  // This covers both direct sends (via notificationLog) and Mautic triggers
  const steps = await prisma.studentCampaignStep.findMany({
    where: {
      studentCampaign: { studentId },
      status: { in: ['sent', 'failed'] },
    },
    include: {
      template: { select: { name: true, channel: true, templateKey: true, deliveryMode: true } },
      notificationLog: { select: { id: true, status: true, recipient: true, sentAt: true } },
    },
    orderBy: { sentAt: 'desc' },
    take: 50,
  })

  return steps.map((s) => ({
    id: s.id,
    templateName: s.template.name,
    templateKey: s.template.templateKey,
    channel: s.template.channel,
    deliveryMode: s.template.deliveryMode,
    status: s.status,
    sentAt: s.sentAt?.toISOString() ?? null,
    notificationStatus: s.notificationLog?.status ?? null,
    recipient: s.notificationLog?.recipient ?? null,
    errorMessage: s.errorMessage,
    createdAt: s.createdAt.toISOString(),
  }))
}
