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
 *
 * Signature verification needs the RAW request body, byte-for-byte, so
 * that our HMAC matches what the provider signed. This plugin installs a
 * scoped JSON content-type parser that stashes the raw string on
 * `request.rawBody` before parsing. The global API keeps the default
 * (fast) parser — only webhook routes pay for the extra assignment.
 */

import type { FastifyInstance } from 'fastify'
import * as ctrl from './controller.js'

// Make `rawBody` visible on FastifyRequest everywhere it's read.
declare module 'fastify' {
  interface FastifyRequest {
    rawBody?: string
  }
}

export async function webhookRoutes(server: FastifyInstance) {
  // Scoped to this plugin — global routes are untouched.
  server.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (req, body, done) => {
      const raw = typeof body === 'string' ? body : body.toString('utf8')
      req.rawBody = raw
      if (raw.length === 0) {
        done(null, {})
        return
      }
      try {
        done(null, JSON.parse(raw))
      } catch (err) {
        done(err as Error, undefined)
      }
    },
  )

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
