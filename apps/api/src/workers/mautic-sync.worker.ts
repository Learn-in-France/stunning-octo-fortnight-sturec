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
import { getRedisConnection } from '../lib/queue/connection.js'
import { buildIdempotencyKey, withIdempotency } from '../lib/queue/idempotency.js'
import type { MauticSyncJobData } from '../lib/queue/queues.js'
import * as mautic from '../integrations/mautic/index.js'
import prisma from '../lib/prisma.js'

export function startMauticSyncWorker() {
  const worker = new Worker<MauticSyncJobData>(
    'mautic-sync',
    async (job) => {
      const { entityType, entityId, eventType, triggeringActionId } = job.data

      const idempotencyKey = buildIdempotencyKey('mautic-sync', [
        entityId,
        eventType,
        triggeringActionId,
      ])

      const outcome = await withIdempotency(idempotencyKey, async () => {
        switch (eventType) {
          case 'contact_created':
            return await syncNewContact(entityType, entityId)
          case 'contact_updated':
            return await syncContactUpdate(entityType, entityId)
          case 'campaign_triggered':
            return await handleCampaignTrigger(entityType, entityId, triggeringActionId)
          default:
            return { status: 'skipped' as const, reason: `Unknown event: ${eventType}` }
        }
      })

      // Log the sync attempt
      await prisma.mauticSyncLog.create({
        data: {
          studentId: entityType === 'student' ? entityId : undefined,
          leadId: entityType === 'lead' ? entityId : undefined,
          eventType: eventType as any,
          payloadHash: idempotencyKey,
          status: outcome.skipped ? 'sent' : 'sent',
          completedAt: new Date(),
        },
      })

      if (outcome.skipped) {
        return { status: 'skipped', reason: 'Already processed' }
      }
      return outcome.result
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
) {
  // triggeringActionId contains the campaign ID for campaign triggers
  const campaignId = parseInt(triggeringActionId)
  if (isNaN(campaignId)) {
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
    return { status: 'skipped' as const, reason: 'No Mautic contact ID' }
  }

  await mautic.triggerCampaign(campaignId, mauticContactId)
  return { status: 'triggered' as const, campaignId }
}
