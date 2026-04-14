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

function signaturesMatch(signature: string, expected: string) {
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  return signatureBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
}

// ─── Cal.com ────────────────────────────────────────────────

export async function handleCalcom(request: FastifyRequest, reply: FastifyReply) {
  const secret = process.env.CALCOM_WEBHOOK_SECRET
  if (!secret) {
    request.log.error('CALCOM_WEBHOOK_SECRET not configured')
    return reply.code(503).send({ error: 'Webhook not configured', code: 'WEBHOOK_NOT_CONFIGURED' })
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

  if (!signaturesMatch(signature, expected)) {
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
    return reply.code(503).send({ error: 'Webhook not configured', code: 'WEBHOOK_NOT_CONFIGURED' })
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
    return reply.code(503).send({ error: 'Webhook not configured', code: 'WEBHOOK_NOT_CONFIGURED' })
  }

  // Verify Mautic's Webhook-Signature (base64-encoded HMAC-SHA256)
  const signature = request.headers['webhook-signature'] as string
  if (!signature) {
    return reply.code(401).send({ error: 'Missing signature' })
  }

  const body = JSON.stringify(request.body)
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('base64')

  if (!signaturesMatch(signature, expected)) {
    return reply.code(401).send({ error: 'Invalid signature' })
  }

  await webhookService.enqueueMauticEvent(request.body as Record<string, unknown>)
  return reply.code(200).send({ received: true })
}
