import type { FastifyInstance } from 'fastify'

import { authMiddleware } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/rbac.js'
import * as controller from './controller.js'

export async function opsRoutes(app: FastifyInstance) {
  const adminOnly = [authMiddleware, requireRole('admin')]

  // Queue visibility
  app.get('/ops/queues', { preHandler: adminOnly }, controller.getQueueStats)
  app.get('/ops/queues/:name', { preHandler: adminOnly }, controller.getQueueDetail)
  app.post('/ops/queues/:name/retry', { preHandler: adminOnly }, controller.retryFailedJobs)
  app.post('/ops/queues/:name/pause', { preHandler: adminOnly }, controller.pauseQueue)
  app.post('/ops/queues/:name/resume', { preHandler: adminOnly }, controller.resumeQueue)

  // Job-level operations
  app.get('/ops/queues/:name/jobs/:jobId', { preHandler: adminOnly }, controller.getJobDetail)
  app.post('/ops/queues/:name/jobs/:jobId/retry', { preHandler: adminOnly }, controller.retrySingleJob)

  // Integration health
  app.get('/ops/integrations', { preHandler: adminOnly }, controller.getIntegrationHealth)

  // Alerts
  app.get('/ops/alerts', { preHandler: adminOnly }, controller.getAlerts)

  // History
  app.get('/ops/history/notifications', { preHandler: adminOnly }, controller.getNotificationHistory)
  app.get('/ops/history/mautic', { preHandler: adminOnly }, controller.getMauticSyncHistory)
  app.get('/ops/history/webhooks', { preHandler: adminOnly }, controller.getWebhookHistory)
  app.get('/ops/history/audit', { preHandler: adminOnly }, controller.getAuditHistory)
}
