import Fastify, { type FastifyInstance } from 'fastify'
import sensible from '@fastify/sensible'

import { errorHandler } from '../src/middleware/error-handler.js'
import { authRoutes } from '../src/modules/auth/routes.js'
import { catalogRoutes, publicCatalogRoutes } from '../src/modules/catalog/routes.js'
import { leadRoutes } from '../src/modules/leads/routes.js'
import { studentRoutes } from '../src/modules/students/routes.js'
import { applicationRoutes } from '../src/modules/applications/routes.js'
import { documentRoutes } from '../src/modules/documents/routes.js'
import { teamRoutes } from '../src/modules/team/routes.js'
import { bookingRoutes } from '../src/modules/bookings/routes.js'
import { analyticsRoutes } from '../src/modules/analytics/routes.js'
import { studentPortalRoutes } from '../src/modules/student-portal/routes.js'
import { chatRoutes } from '../src/modules/chat/routes.js'
import { webhookRoutes } from '../src/modules/webhooks/routes.js'
import { opsRoutes } from '../src/modules/ops/routes.js'

export async function createTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false })
  await app.register(sensible)
  app.setErrorHandler(errorHandler)
  await app.register(authRoutes, { prefix: '/api/v1' })
  await app.ready()
  return app
}

export async function createFullTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false })
  await app.register(sensible)
  app.setErrorHandler(errorHandler)
  await app.register(publicCatalogRoutes, { prefix: '/api/v1' })
  await app.register(authRoutes, { prefix: '/api/v1' })
  await app.register(catalogRoutes, { prefix: '/api/v1' })
  await app.register(leadRoutes, { prefix: '/api/v1' })
  await app.register(studentPortalRoutes, { prefix: '/api/v1' })
  await app.register(studentRoutes, { prefix: '/api/v1' })
  await app.register(applicationRoutes, { prefix: '/api/v1' })
  await app.register(documentRoutes, { prefix: '/api/v1' })
  await app.register(teamRoutes, { prefix: '/api/v1' })
  await app.register(bookingRoutes, { prefix: '/api/v1' })
  await app.register(analyticsRoutes, { prefix: '/api/v1' })
  await app.register(chatRoutes, { prefix: '/api/v1' })
  await app.register(webhookRoutes, { prefix: '/api/v1' })
  await app.register(opsRoutes, { prefix: '/api/v1' })
  await app.ready()
  return app
}

export const TEST_FIREBASE_TOKEN = 'test-firebase-token-valid'

export const TEST_ADMIN = {
  uid: 'firebase-admin-test',
  email: 'admin@test.com',
  name: 'Test Admin',
}

export const TEST_STUDENT = {
  uid: 'firebase-student-test',
  email: 'student@test.com',
  name: 'Test Student',
}

export const TEST_COUNSELLOR = {
  uid: 'firebase-counsellor-test',
  email: 'counsellor@test.com',
  name: 'Test Counsellor',
}
