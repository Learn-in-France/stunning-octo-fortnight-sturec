/**
 * Webhook controllers.
 *
 * Each handler verifies the provider's authentication, enqueues the
 * raw payload to the webhooks BullMQ queue, and returns 200.
 * Actual processing happens in the webhooks worker with retry/idempotency.
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import crypto from 'node:crypto'
import * as webhookService from './service.js'

// ─── Cal.com ────────────────────────────────────────────────

export async function handleCalcom(request: FastifyRequest, reply: FastifyReply) {
  const secret = process.env.CALCOM_WEBHOOK_SECRET
  if (!secret) {
    request.log.error('CALCOM_WEBHOOK_SECRET not configured')
    return reply.code(500).send({ error: 'Webhook not configured' })
  }

  // Verify HMAC-SHA256 signature
  const signature = request.headers['x-cal-signature-256'] as string
  if (!signature) {
    return reply.code(401).send({ error: 'Missing signature' })
  }

  const body = JSON.stringify(request.body)
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return reply.code(401).send({ error: 'Invalid signature' })
  }

  // Enqueue for async processing, then return 200
  await webhookService.enqueueCalcomEvent(request.body as Record<string, unknown>)
  return reply.code(200).send({ received: true })
}

// ─── WhatsApp / Sensy.ai ────────────────────────────────────

export async function handleWhatsApp(request: FastifyRequest, reply: FastifyReply) {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET
  if (!secret) {
    request.log.error('WHATSAPP_WEBHOOK_SECRET not configured')
    return reply.code(500).send({ error: 'Webhook not configured' })
  }

  // Verify shared secret token
  const token = (request.query as Record<string, string>)?.token
    || request.headers['x-webhook-secret'] as string

  if (token !== secret) {
    return reply.code(401).send({ error: 'Invalid token' })
  }

  await webhookService.enqueueWhatsAppEvent(request.body as Record<string, unknown>)
  return reply.code(200).send({ received: true })
}

// ─── Mautic ─────────────────────────────────────────────────

export async function handleMautic(request: FastifyRequest, reply: FastifyReply) {
  const secret = process.env.MAUTIC_WEBHOOK_SECRET
  if (!secret) {
    request.log.error('MAUTIC_WEBHOOK_SECRET not configured')
    return reply.code(500).send({ error: 'Webhook not configured' })
  }

  // Verify shared secret in custom header
  const token = request.headers['x-mautic-webhook-secret'] as string
  if (token !== secret) {
    return reply.code(401).send({ error: 'Invalid token' })
  }

  await webhookService.enqueueMauticEvent(request.body as Record<string, unknown>)
  return reply.code(200).send({ received: true })
}
