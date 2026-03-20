import type { FastifyInstance } from 'fastify'

import { authMiddleware } from '../../middleware/auth.js'
import * as ctrl from './controller.js'

export async function notificationRoutes(server: FastifyInstance) {
  const preHandler = [authMiddleware]

  server.get('/users/me/notifications', { preHandler, handler: ctrl.getMyNotifications })

  server.patch('/users/me/notifications/:id/read', {
    preHandler,
    handler: ctrl.markRead,
  })

  server.patch('/users/me/notifications/read-all', {
    preHandler,
    handler: ctrl.markAllRead,
  })
}
