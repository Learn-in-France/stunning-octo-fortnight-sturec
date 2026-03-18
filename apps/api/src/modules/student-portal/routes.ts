import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { authMiddleware } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/rbac.js'
import { validateBody, validateParams } from '../../middleware/validation.js'
import * as ctrl from './controller.js'
import { updateOwnProfileSchema, createSupportRequestSchema, updateNotificationPreferencesSchema } from '@sturec/shared/validation'

const idParamSchema = z.object({ id: z.string().uuid() })

export async function studentPortalRoutes(server: FastifyInstance) {
  const preHandler = [authMiddleware, requireRole('student')]

  server.get('/students/me', { preHandler, handler: ctrl.getOwnProfile })
  server.patch('/students/me', {
    preHandler: [...preHandler, validateBody(updateOwnProfileSchema)],
    handler: ctrl.updateOwnProfile,
  })
  server.get('/students/me/progress', { preHandler, handler: ctrl.getProgress })
  server.get('/students/me/applications', { preHandler, handler: ctrl.getApplications })
  server.get('/students/me/applications/:id', {
    preHandler: [...preHandler, validateParams(idParamSchema)],
    handler: ctrl.getApplicationDetail,
  })
  server.get('/students/me/documents', { preHandler, handler: ctrl.getDocuments })
  server.get('/students/me/requirements', { preHandler, handler: ctrl.getRequirements })
  server.get('/students/me/bookings', { preHandler, handler: ctrl.getBookings })
  server.get('/students/me/notifications', { preHandler, handler: ctrl.getNotifications })
  server.post('/students/me/support', {
    preHandler: [...preHandler, validateBody(createSupportRequestSchema)],
    handler: ctrl.submitSupport,
  })

  // Notification preferences
  server.get('/students/me/notification-preferences', { preHandler, handler: ctrl.getNotificationPreferences })
  server.patch('/students/me/notification-preferences', {
    preHandler: [...preHandler, validateBody(updateNotificationPreferencesSchema)],
    handler: ctrl.updateNotificationPreferences,
  })
}
