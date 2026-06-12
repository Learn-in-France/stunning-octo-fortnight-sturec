/**
 * Intelligence routes — lead-intelligence experiment.
 *
 * Internal-team only (admin/counsellor). Explicit command endpoints for
 * gate + outcome per Hard Rule #5 (no generic PATCH for critical state).
 */

import type { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/rbac.js'
import { validateBody, validateQuery, validateParams } from '../../middleware/validation.js'
import * as ctrl from './controller.js'
import * as schema from './schema.js'

export async function intelligenceRoutes(server: FastifyInstance) {
  // The morning screen: ranked, gated, current-cycle leads
  server.get('/intelligence/work-queue', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateQuery(schema.workQueueQuerySchema)],
    handler: ctrl.getWorkQueue,
  })

  // 6-question gate (progressive — send any subset of answers)
  server.post('/intelligence/leads/:id/gate', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam), validateBody(schema.gateSchema)],
    handler: ctrl.applyGate,
  })

  // Disposition — mandatory on close
  server.post('/intelligence/leads/:id/outcome', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam), validateBody(schema.outcomeSchema)],
    handler: ctrl.recordOutcome,
  })

  // Manual signal logging (WA reply / call / webinar) until channel APIs land
  server.post('/intelligence/leads/:id/events', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam), validateBody(schema.manualEventSchema)],
    handler: ctrl.logManualEvent,
  })

  // Intent timeline for the lead detail page
  server.get('/intelligence/leads/:id/timeline', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam)],
    handler: ctrl.getLeadTimeline,
  })

  // Live funnel by source (the experiment dashboard) — management view, admin only
  server.get('/intelligence/funnel', {
    preHandler: [authMiddleware, requireRole('admin')],
    handler: ctrl.getFunnel,
  })
}
