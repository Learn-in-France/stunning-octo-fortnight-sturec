import type { FastifyInstance } from 'fastify'

import { authMiddleware } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/rbac.js'
import { validateBody, validateQuery, validateParams } from '../../middleware/validation.js'
import * as ctrl from './controller.js'
import * as schema from './schema.js'
import { paginationSchema, createActivitySchema } from '@sturec/shared/validation'

export async function leadRoutes(server: FastifyInstance) {
  // List/create
  server.get('/leads', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateQuery(schema.leadFilterSchema)],
    handler: ctrl.listLeads,
  })
  server.post('/leads', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor', 'student'), validateBody(schema.createLeadSchema)],
    handler: ctrl.createLead,
  })

  // Detail/update
  server.get('/leads/:id', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam)],
    handler: ctrl.getLead,
  })
  server.patch('/leads/:id', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam), validateBody(schema.updateLeadSchema)],
    handler: ctrl.updateLead,
  })

  // Import
  server.post('/leads/import', {
    preHandler: [authMiddleware, requireRole('admin'), validateBody(schema.importLeadsSchema)],
    handler: ctrl.importLeads,
  })

  // Commands
  server.post('/leads/:id/assign', {
    preHandler: [authMiddleware, requireRole('admin'), validateParams(schema.idParam), validateBody(schema.assignLeadSchema)],
    handler: ctrl.assignLead,
  })
  server.post('/leads/:id/disqualify', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam), validateBody(schema.disqualifyLeadSchema)],
    handler: ctrl.disqualifyLead,
  })
  server.post('/leads/:id/convert', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam)],
    handler: ctrl.convertLead,
  })

  // Activities
  server.get('/leads/:id/activities', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam), validateQuery(paginationSchema)],
    handler: ctrl.listActivities,
  })
  server.post('/leads/:id/activities', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam), validateBody(createActivitySchema)],
    handler: ctrl.createActivity,
  })

  // AI Assessments
  server.get('/leads/:id/ai-assessments', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam)],
    handler: ctrl.listAssessments,
  })
  server.get('/leads/:id/ai-assessments/:assessmentId', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.assessmentIdParam)],
    handler: ctrl.getAssessment,
  })
}
