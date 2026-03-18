/**
 * Webhook service — enqueues received webhook payloads as BullMQ jobs.
 *
 * No DB work happens here. The controller verifies auth and calls
 * these functions which enqueue to the webhooks queue. The webhooks
 * worker processes the actual payloads with retry/idempotency.
 */

import { getWebhooksQueue } from '../../lib/queue/index.js'

export async function enqueueCalcomEvent(raw: Record<string, unknown>) {
  await getWebhooksQueue().add('calcom-event', {
    provider: 'calcom',
    payload: raw,
  })
}

export async function enqueueWhatsAppEvent(raw: Record<string, unknown>) {
  await getWebhooksQueue().add('whatsapp-event', {
    provider: 'whatsapp',
    payload: raw,
  })
}

export async function enqueueMauticEvent(raw: Record<string, unknown>) {
  await getWebhooksQueue().add('mautic-event', {
    provider: 'mautic',
    payload: raw,
  })
}
