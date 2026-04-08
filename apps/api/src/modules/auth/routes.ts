import type { FastifyInstance } from 'fastify'

import { authMiddleware } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validation.js'
import {
  acceptInviteRequestSchema,
  updateUserProfileSchema,
  validateInviteSchema,
} from '@sturec/shared/validation'
import * as authController from './controller.js'

export async function authRoutes(server: FastifyInstance) {
  server.post('/auth/verify', authController.verify)
  server.post('/auth/register', authController.register)
  server.post('/auth/validate-invite', {
    preHandler: [validateBody(validateInviteSchema)],
    handler: authController.validateInvite,
  })
  server.post('/auth/accept-invite', {
    preHandler: [validateBody(acceptInviteRequestSchema)],
    handler: authController.acceptInvite,
  })

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
