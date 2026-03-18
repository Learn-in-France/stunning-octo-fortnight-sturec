import type { FastifyInstance } from 'fastify'

import { authMiddleware } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/rbac.js'
import { validateParams, validateBody } from '../../middleware/validation.js'
import * as ctrl from './controller.js'
import { sendMessageSchema } from '@sturec/shared/validation'
import { z } from 'zod'

const idParamSchema = z.object({ id: z.string().uuid() })

export async function chatRoutes(server: FastifyInstance) {
  const studentOnly = [authMiddleware, requireRole('student')]

  // Sessions
  server.post('/chat/sessions', {
    preHandler: studentOnly,
    handler: ctrl.startSession,
  })

  server.get('/chat/sessions', {
    preHandler: studentOnly,
    handler: ctrl.listSessions,
  })

  server.get('/chat/sessions/:id', {
    preHandler: [...studentOnly, validateParams(idParamSchema)],
    handler: ctrl.getSession,
  })

  server.post('/chat/sessions/:id/end', {
    preHandler: [...studentOnly, validateParams(idParamSchema)],
    handler: ctrl.endSession,
  })

  // Messages
  server.get('/chat/sessions/:id/messages', {
    preHandler: [...studentOnly, validateParams(idParamSchema)],
    handler: ctrl.getMessages,
  })

  server.post('/chat/sessions/:id/messages', {
    preHandler: [...studentOnly, validateParams(idParamSchema), validateBody(sendMessageSchema)],
    handler: ctrl.sendMessage,
  })
}
