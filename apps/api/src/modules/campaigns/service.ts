import * as repo from './repository.js'
import { getNotificationsQueue, getMauticSyncQueue } from '../../lib/queue/index.js'
import type { RequestUser } from '../../middleware/auth.js'
import { canAccessStudent } from '../students/service.js'

// ─── Admin: Templates ───────────────────────────────────────

export const listTemplates = repo.findTemplates
export const getTemplate = repo.findTemplateById
export const createTemplate = repo.createTemplate
export const updateTemplate = repo.updateTemplate

// ─── Admin: Packs ───────────────────────────────────────────

export const listPacks = repo.findPacks
export const getPack = repo.findPackById
export const createPack = repo.createPack
export const updatePack = repo.updatePack

// ─── Counsellor: Student Campaigns ──────────────────────────

export async function listStudentCampaigns(studentId: string, user: RequestUser) {
  if (!(await canAccessStudent(studentId, user))) return null
  return repo.findStudentCampaigns(studentId)
}

export async function startCampaign(data: {
  studentId: string
  counsellorId: string
  packId: string
  user: RequestUser
}) {
  if (!(await canAccessStudent(data.studentId, data.user))) return null

  const pack = await repo.findPackById(data.packId)
  if (!pack) throw new Error('Pack not found')

  // Create the campaign instance
  const campaign = await repo.createStudentCampaign({
    studentId: data.studentId,
    counsellorId: data.counsellorId,
    packId: data.packId,
    phaseKey: pack.phaseKey,
  })

  // Create steps from pack template
  const steps = pack.steps.map((ps) => ({
    templateId: ps.templateId,
    orderIndex: ps.orderIndex,
    scheduledFor: undefined as Date | undefined,
  }))

  await repo.createStudentCampaignSteps(campaign.id, steps)

  // Return with steps included
  return repo.findStudentCampaignById(campaign.id)
}

export async function sendStep(stepId: string, studentId: string, user: RequestUser) {
  if (!(await canAccessStudent(studentId, user))) return null

  const step = await findStepWithContext(stepId)
  if (!step) return null
  if (step.studentCampaign.studentId !== studentId) return null
  if (step.status !== 'pending' && step.status !== 'scheduled') return null

  return executeStep(step)
}

export async function sendAllDue(campaignId: string, studentId: string, user: RequestUser) {
  if (!(await canAccessStudent(studentId, user))) return null

  const campaign = await repo.findStudentCampaignById(campaignId)
  if (!campaign || campaign.studentId !== studentId) return null

  const pendingSteps = campaign.steps.filter(
    (s) => s.status === 'pending' || s.status === 'scheduled',
  )

  const results = []
  for (const step of pendingSteps) {
    const full = await findStepWithContext(step.id)
    if (full) {
      const result = await executeStep(full)
      results.push(result)
    }
  }

  // Check if all steps are done; queued steps remain active until workers confirm delivery.
  const updated = await repo.findStudentCampaignById(campaignId)
  if (updated && updated.steps.every((s) => s.status === 'sent' || s.status === 'skipped')) {
    await repo.updateStudentCampaign(campaignId, {
      status: 'completed',
      completedAt: new Date(),
    })
  }

  return results
}

export async function pauseCampaign(campaignId: string, studentId: string, user: RequestUser) {
  if (!(await canAccessStudent(studentId, user))) return null

  const campaign = await repo.findStudentCampaignById(campaignId)
  if (!campaign || campaign.studentId !== studentId) return null

  return repo.updateStudentCampaign(campaignId, {
    status: 'paused',
    pausedAt: new Date(),
  })
}

export async function resumeCampaign(campaignId: string, studentId: string, user: RequestUser) {
  if (!(await canAccessStudent(studentId, user))) return null

  const campaign = await repo.findStudentCampaignById(campaignId)
  if (!campaign || campaign.studentId !== studentId) return null

  return repo.updateStudentCampaign(campaignId, {
    status: 'active',
  })
}

export async function updateCampaignMode(campaignId: string, mode: string, studentId: string, user: RequestUser) {
  if (!(await canAccessStudent(studentId, user))) return null

  const campaign = await repo.findStudentCampaignById(campaignId)
  if (!campaign || campaign.studentId !== studentId) return null

  await repo.updateStudentCampaign(campaignId, { mode })

  // If switching to automated, schedule pending steps based on delay days
  if (mode === 'automated') {
    const now = new Date()
    for (const step of campaign.steps) {
      if (step.status === 'pending') {
        const packStep = campaign.pack.steps.find((ps) => ps.templateId === step.templateId)
        const delayDays = packStep?.delayDays ?? step.template?.defaultDelayDays ?? 0
        const scheduledFor = new Date(now.getTime() + delayDays * 24 * 60 * 60 * 1000)
        await repo.updateStepStatus(step.id, {
          status: 'scheduled',
          scheduledFor,
        } as any)
      }
    }
  }

  return repo.findStudentCampaignById(campaignId)
}

// ─── History ────────────────────────────────────────────────

export async function getCampaignHistory(studentId: string, user: RequestUser) {
  if (!(await canAccessStudent(studentId, user))) return null
  return repo.findStudentCampaignHistory(studentId)
}

// ─── Scheduler (for automated steps) ────────────────────────

export async function processDueSteps() {
  const dueSteps = await repo.findDueSteps()

  for (const step of dueSteps) {
    try {
      await executeStep(step)
    } catch (err) {
      await repo.updateStepStatus(step.id, {
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return dueSteps.length
}

// ─── Internal: Execute a single step ────────────────────────

async function executeStep(step: {
  id: string
  template: { channel: string; templateKey: string; deliveryMode: string; mauticCampaignId: number | null }
  studentCampaign: { studentId: string; student?: { id: string; userId: string } | null }
}) {
  const { template } = step
  const studentId = step.studentCampaign.studentId

  if (template.deliveryMode === 'mautic_campaign_trigger' && template.mauticCampaignId) {
    // Mautic-backed delivery — use the real numeric campaign ID
    getMauticSyncQueue().add('campaign-trigger', {
      entityType: 'student',
      entityId: studentId,
      eventType: 'campaign_triggered',
      triggeringActionId: String(template.mauticCampaignId),
      campaignStepId: step.id,
    }).catch((err) => console.error('[campaigns] Mautic trigger failed:', err))

    // Mark as scheduled — worker will update to sent/failed after Mautic API call
    await repo.updateStepStatus(step.id, { status: 'scheduled' })
  } else {
    // Direct delivery via notification worker
    await getNotificationsQueue().add(`campaign-step-${step.id}`, {
      recipientId: step.studentCampaign.student?.userId ?? studentId,
      channel: template.channel as any,
      templateKey: template.templateKey,
      data: {
        studentId,
        campaignStepId: step.id,
        triggeringActionId: step.id,
      },
    })

    // Mark as scheduled — worker will update to sent/failed via notificationLog linkage
    await repo.updateStepStatus(step.id, {
      status: 'scheduled',
    })
  }

  return step
}

async function findStepWithContext(stepId: string) {
  const prisma = (await import('../../lib/prisma.js')).default
  return prisma.studentCampaignStep.findUnique({
    where: { id: stepId },
    include: {
      template: true,
      studentCampaign: {
        include: { student: { select: { id: true, userId: true } } },
      },
    },
  })
}
