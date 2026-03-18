import type { FastifyInstance } from 'fastify'

import { authMiddleware } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validation.js'
import { updateUserProfileSchema } from '@sturec/shared/validation'
import * as authController from './controller.js'

export async function authRoutes(server: FastifyInstance) {
  server.post('/auth/verify', authController.verify)
  server.post('/auth/register', authController.register)
  server.post('/auth/accept-invite', authController.acceptInvite)

  // User profile (any authenticated role)
  server.get('/users/me', {
    preHandler: [authMiddleware],
    handler: authController.getUserProfile,
  })
  server.patch('/users/me', {
    preHandler: [authMiddleware, validateBody(updateUserProfileSchema)],
    handler: authController.updateUserProfile,
  })
}
