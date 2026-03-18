import type { FastifyInstance } from 'fastify'

import { authMiddleware } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/rbac.js'
import { validateBody, validateParams } from '../../middleware/validation.js'
import * as ctrl from './controller.js'
import * as schema from './schema.js'

export async function teamRoutes(server: FastifyInstance) {
  server.get('/team', {
    preHandler: [authMiddleware, requireRole('admin')],
    handler: ctrl.listTeamMembers,
  })

  server.post('/team/invite', {
    preHandler: [authMiddleware, requireRole('admin'), validateBody(schema.inviteTeamMemberSchema)],
    handler: ctrl.inviteTeamMember,
  })

  server.patch('/team/:id', {
    preHandler: [authMiddleware, requireRole('admin'), validateParams(schema.idParam), validateBody(schema.updateTeamMemberSchema)],
    handler: ctrl.updateTeamMember,
  })

  server.get('/team/:id/assignments', {
    preHandler: [authMiddleware, requireRole('admin'), validateParams(schema.idParam)],
    handler: ctrl.listCounsellorAssignments,
  })
}
