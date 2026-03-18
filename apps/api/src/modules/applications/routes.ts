import type { FastifyInstance } from 'fastify'

import { authMiddleware } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/rbac.js'
import { validateBody, validateQuery, validateParams } from '../../middleware/validation.js'
import * as ctrl from './controller.js'
import * as schema from './schema.js'
import { applicationFilterSchema } from '@sturec/shared/validation'

export async function applicationRoutes(server: FastifyInstance) {
  // Student-scoped: list + create
  server.get('/students/:id/applications', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor', 'student'), validateParams(schema.idParam)],
    handler: ctrl.listStudentApplications,
  })
  server.post('/students/:id/applications', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam), validateBody(schema.createApplicationSchema)],
    handler: ctrl.createApplication,
  })

  // Global: list all with filters (admin only)
  server.get('/applications', {
    preHandler: [authMiddleware, requireRole('admin'), validateQuery(applicationFilterSchema)],
    handler: ctrl.listAllApplications,
  })

  // Update status
  server.patch('/applications/:id', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam), validateBody(schema.updateApplicationStatusSchema)],
    handler: ctrl.updateApplicationStatus,
  })
}
