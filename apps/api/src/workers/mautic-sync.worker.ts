/**
 * Mautic Sync Worker
 *
 * Pushes data downstream to Mautic CRM. Mautic is never the source of truth.
 * Handles: contact creation, contact updates, campaign triggers.
 *
 * Triggered by: lead creation, lead conversion, stage change,
 * qualification/priority update, admin manual trigger.
 *
 * See: docs/architecture/06-queues-and-workers.md
 */

import { Worker } from 'bullmq'
import { Prisma, MauticEventType, SyncStatus } from '@prisma/client'
import { getRedisConnection } from '../lib/queue/connection.js'
import { buildIdempotencyKey, withIdempotency } from '../lib/queue/idempotency.js'
import type { MauticSyncJobData } from '../lib/queue/queues.js'
import * as mautic from '../integrations/mautic/index.js'
import prisma from '../lib/prisma.js'
import { completeCampaignIfAllStepsSettled } from '../modules/campaigns/completion.js'

const VALID_EVENT_TYPES: ReadonlySet<string> = new Set<string>(
  Object.values(MauticEventType),
)

function toMauticEventType(value: string): MauticEventType | null {
  return VALID_EVENT_TYPES.has(value) ? (value as MauticEventType) : null
}

async function writeSyncLog(params: {
  entityType: string
  entityId: string
  eventType: string
  payloadHash: string
  status: SyncStatus
  lastError?: string
}) {
  const event = toMauticEventType(params.eventType)
  if (!event) {
    // Schema-enforced enum — nothing we can persist, but we still want trace.
    console.warn(
      `[mautic-sync] Skipping log write for invalid eventType=${params.eventType}`,
    )
    return
  }
  try {
    await prisma.mauticSyncLog.create({
      data: {
        studentId: params.entityType === 'student' ? params.entityId : undefined,
        leadId: params.entityType === 'lead' ? params.entityId : undefined,
        eventType: event,
        payloadHash: params.payloadHash,
        status: params.status,
        lastError: params.lastError,
        completedAt: new Date(),
      } satisfies Prisma.MauticSyncLogUncheckedCreateInput,
    })
  } catch (logErr) {
    console.error('[mautic-sync] Failed to write sync log:', logErr)
  }
}

export function startMauticSyncWorker() {
  const worker = new Worker<MauticSyncJobData>(
    'mautic-sync',
    async (job) => {
      const { entityType, entityId, eventType, triggeringActionId, campaignStepId } = job.data

      const idempotencyKey = buildIdempotencyKey('mautic-sync', [
        entityId,
        eventType,
        triggeringActionId,
      ])

      try {
        const outcome = await withIdempotency(idempotencyKey, async () => {
          switch (eventType) {
            case 'contact_created':
              return await syncNewContact(entityType, entityId)
            case 'contact_updated':
              return await syncContactUpdate(entityType, entityId)
            case 'campaign_triggered':
              return await handleCampaignTrigger(entityType, entityId, triggeringActionId, campaignStepId)
            default:
              return { status: 'skipped' as const, reason: `Unknown event: ${eventType}` }
          }
        })

        if (outcome.skipped) {
          // Idempotent replay — do not write a fresh log row; the original
          // job already recorded the outcome.
          return { status: 'skipped', reason: 'Already processed' }
        }

        // Successful work: record as sent so failed syncs remain visible by
        // absence of a matching sent row.
        await writeSyncLog({
          entityType,
          entityId,
          eventType,
          payloadHash: idempotencyKey,
          status: SyncStatus.sent,
        })

        return outcome.result
      } catch (err) {
        // Real failure: persist a failed log with the error and rethrow so
        // BullMQ retries.
        const message = err instanceof Error ? err.message : String(err)
        await writeSyncLog({
          entityType,
          entityId,
          eventType,
          payloadHash: idempotencyKey,
          status: SyncStatus.failed,
          lastError: message,
        })
        throw err
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
    },
  )

  worker.on('completed', (job) => {
    console.log(`[mautic-sync] Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[mautic-sync] Job ${job?.id} failed:`, err.message)
  })

  return worker
}

// ─── Sync handlers ─────────────────────────────────────────

async function syncNewContact(entityType: string, entityId: string) {
  if (entityType === 'lead') {
    const lead = await prisma.lead.findUnique({
      where: { id: entityId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        qualificationScore: true,
        priorityLevel: true,
        mauticContactId: true,
      },
    })
    if (!lead) return { status: 'skipped' as const, reason: 'Lead not found' }
    if (lead.mauticContactId) return { status: 'skipped' as const, reason: 'Already synced' }

    // Check if contact already exists in Mautic
    const existing = await mautic.findContactByEmail(lead.email)
    let mauticId: number

    if (existing) {
      mauticId = existing.id
      await mautic.updateContact(mauticId, {
        firstname: lead.firstName,
        lastname: lead.lastName || undefined,
        phone: lead.phone || undefined,
        sturec_lead_id: lead.id,
        sturec_qualification_score: lead.qualificationScore ?? undefined,
        sturec_priority_level: lead.priorityLevel || undefined,
      })
    } else {
      mauticId = await mautic.createContact({
        email: lead.email,
        firstname: lead.firstName,
        lastname: lead.lastName || undefined,
        phone: lead.phone || undefined,
        tags: ['lead'],
        sturec_lead_id: lead.id,
        sturec_qualification_score: lead.qualificationScore ?? undefined,
        sturec_priority_level: lead.priorityLevel || undefined,
      })
    }

    // Store Mautic contact ID back
    await prisma.lead.update({
      where: { id: entityId },
      data: { mauticContactId: mauticId },
    })

    return { status: 'created' as const, mauticContactId: mauticId }
  }

  if (entityType === 'student') {
    const student = await prisma.student.findUnique({
      where: { id: entityId },
      include: {
        user: { select: { email: true, firstName: true, lastName: true, phone: true } },
      },
    })
    if (!student) return { status: 'skipped' as const, reason: 'Student not found' }
    if (student.mauticContactId) return { status: 'skipped' as const, reason: 'Already synced' }

    const existing = await mautic.findContactByEmail(student.user.email)
    let mauticId: number

    if (existing) {
      mauticId = existing.id
      await mautic.updateContact(mauticId, {
        firstname: student.user.firstName,
        lastname: student.user.lastName,
        phone: student.user.phone || undefined,
        tags: ['student'],
        sturec_student_id: student.id,
        sturec_stage: student.stage,
      })
    } else {
      mauticId = await mautic.createContact({
        email: student.user.email,
        firstname: student.user.firstName,
        lastname: student.user.lastName,
        phone: student.user.phone || undefined,
        tags: ['student'],
        sturec_student_id: student.id,
        sturec_stage: student.stage,
      })
    }

    await prisma.student.update({
      where: { id: entityId },
      data: { mauticContactId: mauticId },
    })

    return { status: 'created' as const, mauticContactId: mauticId }
  }

  return { status: 'skipped' as const, reason: `Unknown entity type: ${entityType}` }
}

async function syncContactUpdate(entityType: string, entityId: string) {
  if (entityType === 'lead') {
    const lead = await prisma.lead.findUnique({
      where: { id: entityId },
      select: {
        mauticContactId: true,
        qualificationScore: true,
        priorityLevel: true,
        status: true,
      },
    })
    if (!lead?.mauticContactId) return { status: 'skipped' as const, reason: 'No Mautic ID' }

    await mautic.updateContact(lead.mauticContactId, {
      sturec_qualification_score: lead.qualificationScore ?? undefined,
      sturec_priority_level: lead.priorityLevel || undefined,
    })

    return { status: 'updated' as const }
  }

  if (entityType === 'student') {
    const student = await prisma.student.findUnique({
      where: { id: entityId },
      select: { mauticContactId: true, stage: true },
    })
    if (!student?.mauticContactId) return { status: 'skipped' as const, reason: 'No Mautic ID' }

    await mautic.updateContact(student.mauticContactId, {
      sturec_stage: student.stage,
    })

    return { status: 'updated' as const }
  }

  return { status: 'skipped' as const, reason: `Unknown entity type: ${entityType}` }
}

async function handleCampaignTrigger(
  entityType: string,
  entityId: string,
  triggeringActionId: string,
  campaignStepId?: string,
) {
  // triggeringActionId contains the campaign ID for campaign triggers
  const campaignId = parseInt(triggeringActionId)
  if (isNaN(campaignId)) {
    // Update step as failed if we have a step reference
    if (campaignStepId) {
      await prisma.studentCampaignStep.update({
        where: { id: campaignStepId },
        data: { status: 'failed', errorMessage: 'Invalid Mautic campaign ID' },
      }).catch(() => {})
    }
    return { status: 'skipped' as const, reason: 'Invalid campaign ID' }
  }

  let mauticContactId: number | null = null

  if (entityType === 'student') {
    const student = await prisma.student.findUnique({
      where: { id: entityId },
      select: { mauticContactId: true },
    })
    mauticContactId = student?.mauticContactId ?? null
  } else if (entityType === 'lead') {
    const lead = await prisma.lead.findUnique({
      where: { id: entityId },
      select: { mauticContactId: true },
    })
    mauticContactId = lead?.mauticContactId ?? null
  }

  if (!mauticContactId) {
    if (campaignStepId) {
      await prisma.studentCampaignStep.update({
        where: { id: campaignStepId },
        data: { status: 'failed', errorMessage: 'No Mautic contact ID for this student' },
      }).catch(() => {})
    }
    return { status: 'skipped' as const, reason: 'No Mautic contact ID' }
  }

  try {
    await mautic.triggerCampaign(campaignId, mauticContactId)

    // Mark step as sent after successful Mautic API call
    if (campaignStepId) {
      await prisma.studentCampaignStep.update({
        where: { id: campaignStepId },
        data: { status: 'sent', sentAt: new Date() },
      }).catch(() => {})
      await completeCampaignIfAllStepsSettled(campaignStepId).catch(() => {})
    }

    return { status: 'triggered' as const, campaignId }
  } catch (err) {
    // Mark step as failed
    if (campaignStepId) {
      await prisma.studentCampaignStep.update({
        where: { id: campaignStepId },
        data: { status: 'failed', errorMessage: err instanceof Error ? err.message : String(err) },
      }).catch(() => {})
    }
    throw err
  }
}
