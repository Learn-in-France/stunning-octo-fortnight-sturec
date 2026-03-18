/**
 * Webhook receivers for external service integrations.
 *
 * All webhook endpoints:
 * - Verify signature/secret before processing
 * - Return 200 immediately, enqueue actual processing
 * - Log received payloads for debugging
 * - Are idempotent (duplicate delivery → no duplicate side effects)
 *
 * No auth middleware — verified by provider-specific secrets.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import * as ctrl from './controller.js'

export async function webhookRoutes(server: FastifyInstance) {
  // Cal.com booking events
  server.post('/webhooks/calcom', {
    handler: ctrl.handleCalcom,
  })

  // WhatsApp / Sensy.ai inbound messages
  server.post('/webhooks/whatsapp', {
    handler: ctrl.handleWhatsApp,
  })

  // Mautic campaign event callbacks
  server.post('/webhooks/mautic', {
    handler: ctrl.handleMautic,
  })
}
