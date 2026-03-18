import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import sensible from '@fastify/sensible'

import { errorHandler } from './middleware/error-handler.js'
import { authRoutes } from './modules/auth/routes.js'
import { catalogRoutes, publicCatalogRoutes } from './modules/catalog/routes.js'
import { leadRoutes } from './modules/leads/routes.js'
import { studentRoutes } from './modules/students/routes.js'
import { applicationRoutes } from './modules/applications/routes.js'
import { documentRoutes } from './modules/documents/routes.js'
import { teamRoutes } from './modules/team/routes.js'
import { bookingRoutes } from './modules/bookings/routes.js'
import { analyticsRoutes } from './modules/analytics/routes.js'
import { studentPortalRoutes } from './modules/student-portal/routes.js'
import { chatRoutes } from './modules/chat/routes.js'
import { webhookRoutes } from './modules/webhooks/routes.js'
import { opsRoutes } from './modules/ops/routes.js'

const server = Fastify({ logger: true })

await server.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
})
await server.register(helmet)
await server.register(sensible)

server.setErrorHandler(errorHandler)

server.get('/health', async () => ({ status: 'ok' }))

// Public routes (no auth)
await server.register(publicCatalogRoutes, { prefix: '/api/v1' })

// API routes (auth required)
await server.register(authRoutes, { prefix: '/api/v1' })
await server.register(catalogRoutes, { prefix: '/api/v1' })
await server.register(leadRoutes, { prefix: '/api/v1' })
await server.register(studentPortalRoutes, { prefix: '/api/v1' })  // Must register before studentRoutes (/me before /:id)
await server.register(studentRoutes, { prefix: '/api/v1' })
await server.register(applicationRoutes, { prefix: '/api/v1' })
await server.register(documentRoutes, { prefix: '/api/v1' })
await server.register(teamRoutes, { prefix: '/api/v1' })
await server.register(bookingRoutes, { prefix: '/api/v1' })
await server.register(analyticsRoutes, { prefix: '/api/v1' })
await server.register(chatRoutes, { prefix: '/api/v1' })
await server.register(opsRoutes, { prefix: '/api/v1' })

// Webhook routes (no auth — verified by provider-specific secrets)
await server.register(webhookRoutes, { prefix: '/api/v1' })

const port = parseInt(process.env.PORT || process.env.API_PORT || '3001')

await server.listen({ port, host: '0.0.0.0' })

server.log.info(`API server listening on port ${port}`)
