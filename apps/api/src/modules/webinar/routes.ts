import type { FastifyInstance } from 'fastify'

import { validateBody } from '../../middleware/validation.js'
import * as ctrl from './controller.js'
import { rsvpSchema } from './schema.js'

/**
 * Public webinar routes — no auth. Anonymous visitors RSVP via tokenised
 * email link or directly. Each successful RSVP creates a Sturec lead
 * tagged with `Webinar May 15 2026 RSVP`, kicks off a Mautic tag update
 * (best-effort), and sends a Brevo confirmation email.
 */
export async function webinarRoutes(server: FastifyInstance) {
  server.post('/webinar/rsvp', {
    preHandler: [validateBody(rsvpSchema)],
    handler: ctrl.recordRsvp,
  })

  server.get('/webinar/rsvp/count', {
    handler: ctrl.getRsvpCount,
  })
}
