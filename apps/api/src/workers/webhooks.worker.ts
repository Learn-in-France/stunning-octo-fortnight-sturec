/**
 * Webhooks Worker
 *
 * Processes webhook payloads enqueued by the webhook controllers.
 * Handles Cal.com booking events, WhatsApp inbound messages,
 * and Mautic campaign callbacks.
 *
 * Retry-safe via BullMQ retries + idempotency on booking creation.
 */

import { Worker } from 'bullmq'
import { getRedisConnection } from '../lib/queue/connection.js'
import { buildIdempotencyKey, withIdempotency } from '../lib/queue/idempotency.js'
import { getIntelligenceQueue, type WebhookJobData } from '../lib/queue/index.js'
import prisma from '../lib/prisma.js'
import { resolveLeadId, resolveLeadIdByPhone, recordEvents } from '../modules/intelligence/repository.js'
import { classifyLink, type NewLeadEvent } from '../modules/intelligence/types.js'

export function startWebhooksWorker() {
  const worker = new Worker<WebhookJobData>(
    'webhooks',
    async (job) => {
      const { provider, payload } = job.data

      switch (provider) {
        case 'calcom':
          return await processCalcomEvent(payload)
        case 'whatsapp':
          return await processWhatsAppEvent(payload)
        case 'mautic':
          return await processMauticEvent(payload)
        case 'brevo':
          return await processBrevoEvent(payload)
        default:
          return { status: 'skipped', reason: `Unknown provider: ${provider}` }
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
    },
  )

  worker.on('completed', (job) => {
    console.log(`[webhooks] Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[webhooks] Job ${job?.id} failed:`, err.message)
  })

  return worker
}

// ─── Cal.com ────────────────────────────────────────────────

interface CalcomPayload {
  triggerEvent: string
  payload: {
    uid: string
    title?: string
    startTime?: string
    endTime?: string
    status?: string
    attendees?: Array<{ email: string; name: string }>
    organizer?: { email: string; name: string }
    metadata?: Record<string, unknown>
  }
}

async function processCalcomEvent(raw: Record<string, unknown>) {
  const payload = raw as unknown as CalcomPayload
  const event = payload.triggerEvent
  const bookingUid = payload.payload?.uid

  if (!bookingUid) return { status: 'skipped', reason: 'No booking UID' }

  const idempotencyKey = buildIdempotencyKey('webhook-calcom', [bookingUid, event])

  const outcome = await withIdempotency(idempotencyKey, async () => {
    switch (event) {
      case 'BOOKING_CREATED': {
        const studentId = payload.payload.metadata?.studentId as string | undefined
        const leadId = payload.payload.metadata?.leadId as string | undefined
        const counsellorEmail = payload.payload.organizer?.email

        if (!counsellorEmail) return { status: 'skipped' as const, reason: 'No organizer email' }

        const counsellor = await prisma.user.findUnique({
          where: { email: counsellorEmail },
          select: { id: true },
        })
        if (!counsellor) return { status: 'skipped' as const, reason: 'Counsellor not found' }

        await prisma.booking.create({
          data: {
            studentId: studentId || undefined,
            leadId: leadId || undefined,
            counsellorId: counsellor.id,
            calcomEventId: bookingUid,
            scheduledAt: new Date(payload.payload.startTime || Date.now()),
            status: 'scheduled',
            notes: payload.payload.title || undefined,
          },
        })

        // Booking = strongest intent signal; resolve lead via metadata or attendee email
        const attendeeEmail = payload.payload.attendees?.[0]?.email
        const eventLeadId = leadId || (attendeeEmail ? await resolveLeadId({ email: attendeeEmail }) : null)
        if (eventLeadId) {
          await ingestEvents([
            {
              leadId: eventLeadId,
              eventType: 'booking',
              origin: 'calcom',
              occurredAt: new Date(),
              metadata: { bookingUid },
            },
          ])
        }
        return { status: 'created' as const }
      }

      case 'BOOKING_CANCELLED': {
        await prisma.booking.updateMany({
          where: { calcomEventId: bookingUid },
          data: {
            status: 'cancelled',
            externalStatus: 'cancelled',
            lastSyncedAt: new Date(),
          },
        })
        return { status: 'updated' as const, action: 'cancelled' }
      }

      case 'BOOKING_RESCHEDULED': {
        await prisma.booking.updateMany({
          where: { calcomEventId: bookingUid },
          data: {
            scheduledAt: new Date(payload.payload.startTime || Date.now()),
            externalStatus: 'rescheduled',
            lastSyncedAt: new Date(),
          },
        })
        return { status: 'updated' as const, action: 'rescheduled' }
      }

      case 'MEETING_ENDED': {
        await prisma.booking.updateMany({
          where: { calcomEventId: bookingUid },
          data: {
            status: 'completed',
            externalStatus: 'completed',
            lastSyncedAt: new Date(),
          },
        })
        return { status: 'updated' as const, action: 'completed' }
      }

      default:
        return { status: 'skipped' as const, reason: `Unknown event: ${event}` }
    }
  })

  if (outcome.skipped) return { status: 'skipped', reason: 'Already processed' }
  return outcome.result
}

// ─── WhatsApp / Sensy.ai ────────────────────────────────────

interface WhatsAppPayload {
  from: string
  message?: { text?: string; type?: string }
  timestamp?: string
}

async function processWhatsAppEvent(raw: Record<string, unknown>) {
  const payload = raw as unknown as WhatsAppPayload

  if (!payload.from || !payload.message?.text) {
    return { status: 'skipped', reason: 'Missing from or message text' }
  }

  const idempotencyKey = buildIdempotencyKey('webhook-whatsapp', [
    payload.from,
    payload.timestamp || new Date().toISOString(),
  ])

  const outcome = await withIdempotency(idempotencyKey, async () => {
    await prisma.notificationLog.create({
      data: {
        recipient: payload.from,
        channel: 'whatsapp',
        provider: 'sensy',
        templateKey: 'inbound_message',
        payloadJson: raw as any,
        status: 'delivered',
        deliveredAt: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      },
    })

    // Inbound WA message = the strongest channel intent signal we have
    const leadId = await resolveLeadIdByPhone(payload.from)
    if (leadId) {
      await ingestEvents([
        {
          leadId,
          eventType: 'wa_reply',
          origin: 'sturec',
          occurredAt: payload.timestamp ? new Date(payload.timestamp) : new Date(),
          metadata: { from: payload.from },
        },
      ])
    }
    return { status: 'logged' as const }
  })

  if (outcome.skipped) return { status: 'skipped', reason: 'Already processed' }
  return outcome.result
}

// ─── Mautic ─────────────────────────────────────────────────

interface MauticLeadEntity {
  id: number
  fields?: { core?: { email?: { value?: string } } }
}

interface MauticWebhookPayload {
  'mautic.lead_post_save_update'?: Array<{ lead: { id: number; fields: Record<string, unknown> } }>
  'mautic.campaign_on_trigger'?: Array<{
    campaignId: number
    eventId: number
    lead: { id: number }
    result?: unknown
  }>
  'mautic.email_on_open'?: Array<{
    stat?: {
      id?: number
      dateRead?: string
      email?: { id?: number; name?: string; subject?: string }
      lead?: MauticLeadEntity
    }
    timestamp?: string
  }>
  'mautic.page_on_hit'?: Array<{
    hit?: {
      id?: number
      dateHit?: string
      url?: string
      urlTitle?: string
      source?: string
      sourceId?: number
      lead?: MauticLeadEntity
    }
    timestamp?: string
  }>
}

function mauticLeadEmail(lead?: MauticLeadEntity): string | undefined {
  return lead?.fields?.core?.email?.value || undefined
}

/** Record events then enqueue intent recompute for the affected leads. */
async function ingestEvents(events: NewLeadEvent[]) {
  const written = await recordEvents(events)
  if (written > 0) {
    const leadIds = [...new Set(events.map((e) => e.leadId))]
    for (const leadId of leadIds) {
      await getIntelligenceQueue().add('intent-recompute', { task: 'intent_recompute', leadId })
    }
  }
  return written
}

async function processMauticEvent(raw: Record<string, unknown>) {
  const payload = raw as unknown as MauticWebhookPayload

  // Handle campaign trigger callbacks — log the result
  const campaignEvents = payload['mautic.campaign_on_trigger']
  if (campaignEvents?.length) {
    for (const event of campaignEvents) {
      const key = buildIdempotencyKey('webhook-mautic', [
        String(event.campaignId),
        String(event.eventId),
        String(event.lead.id),
      ])

      await withIdempotency(key, async () => {
        await prisma.mauticSyncLog.create({
          data: {
            eventType: 'campaign_triggered',
            payloadHash: `mautic-callback:${event.campaignId}:${event.eventId}:${event.lead.id}`,
            status: 'sent',
            completedAt: new Date(),
          },
        })
        return { status: 'logged' as const }
      })
    }
  }

  // Lead updates from Mautic are logged but NOT applied to STUREC
  // (STUREC is source of truth, Mautic is downstream only)
  const leadUpdates = payload['mautic.lead_post_save_update']
  if (leadUpdates?.length) {
    for (const update of leadUpdates) {
      console.log(`[webhooks/mautic] Received lead update for Mautic ID ${update.lead.id} (logged, not applied)`)
    }
  }

  // Engagement signals → lead_events (lead-intelligence experiment)
  let eventsWritten = 0

  const opens = payload['mautic.email_on_open']
  if (opens?.length) {
    const toRecord: NewLeadEvent[] = []
    for (const item of opens) {
      const leadId = await resolveLeadId({
        mauticContactId: item.stat?.lead?.id,
        email: mauticLeadEmail(item.stat?.lead),
      })
      if (!leadId) continue
      toRecord.push({
        leadId,
        eventType: 'email_open',
        origin: 'mautic',
        occurredAt: new Date(item.stat?.dateRead || item.timestamp || Date.now()),
        metadata: { emailId: item.stat?.email?.id, emailName: item.stat?.email?.name },
      })
    }
    eventsWritten += await ingestEvents(toRecord)
  }

  const hits = payload['mautic.page_on_hit']
  if (hits?.length) {
    const toRecord: NewLeadEvent[] = []
    for (const item of hits) {
      const leadId = await resolveLeadId({
        mauticContactId: item.hit?.lead?.id,
        email: mauticLeadEmail(item.hit?.lead),
      })
      if (!leadId || !item.hit?.url) continue
      const category = classifyLink(item.hit.url)
      if (category === 'unsubscribe') continue
      toRecord.push({
        leadId,
        eventType: 'email_click',
        origin: 'mautic',
        occurredAt: new Date(item.hit?.dateHit || item.timestamp || Date.now()),
        linkCategory: category,
        metadata: { url: item.hit.url, source: item.hit.source, sourceId: item.hit.sourceId },
      })
    }
    eventsWritten += await ingestEvents(toRecord)
  }

  return { status: 'processed', eventsWritten }
}

// ─── Brevo ──────────────────────────────────────────────────

interface BrevoWebhookPayload {
  event?: string // 'opened' | 'click' | 'unique_opened' | ...
  email?: string
  link?: string
  date?: string
  ts_event?: number
  'camp id'?: number
  camp_id?: number
}

async function processBrevoEvent(raw: Record<string, unknown>) {
  const payload = raw as unknown as BrevoWebhookPayload
  if (!payload.email || !payload.event) {
    return { status: 'skipped', reason: 'Missing email or event' }
  }

  const isOpen = payload.event === 'opened' || payload.event === 'unique_opened' || payload.event === 'proxy_open'
  const isClick = payload.event === 'click'
  if (!isOpen && !isClick) return { status: 'skipped', reason: `Unhandled event: ${payload.event}` }

  const leadId = await resolveLeadId({ email: payload.email })
  if (!leadId) return { status: 'skipped', reason: 'No matching lead' }

  const occurredAt = payload.ts_event
    ? new Date(payload.ts_event * 1000)
    : new Date(payload.date || Date.now())

  const category = isClick && payload.link ? classifyLink(payload.link) : undefined
  if (category === 'unsubscribe') return { status: 'skipped', reason: 'Unsubscribe link' }

  const written = await ingestEvents([
    {
      leadId,
      eventType: isClick ? 'email_click' : 'email_open',
      origin: 'brevo',
      occurredAt,
      linkCategory: category,
      metadata: { campaignId: payload.camp_id ?? payload['camp id'], link: payload.link },
    },
  ])
  return { status: 'processed', eventsWritten: written }
}
