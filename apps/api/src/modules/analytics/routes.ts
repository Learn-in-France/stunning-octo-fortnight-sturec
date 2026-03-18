import type { FastifyInstance } from 'fastify'

import { authMiddleware } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/rbac.js'
import { validateQuery, validateParams } from '../../middleware/validation.js'
import * as ctrl from './controller.js'
import { analyticsDateRangeSchema } from '@sturec/shared/validation'
import { z } from 'zod'

const idParamSchema = z.object({ id: z.string().uuid() })

export async function analyticsRoutes(server: FastifyInstance) {
  server.get('/analytics/overview', {
    preHandler: [authMiddleware, requireRole('admin'), validateQuery(analyticsDateRangeSchema)],
    handler: ctrl.getOverview,
  })

  server.get('/analytics/pipeline', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateQuery(analyticsDateRangeSchema)],
    handler: ctrl.getPipeline,
  })

  server.get('/analytics/counsellors', {
    preHandler: [authMiddleware, requireRole('admin')],
    handler: ctrl.listCounsellors,
  })

  server.get('/analytics/counsellors/:id', {
    preHandler: [authMiddleware, requireRole('admin'), validateParams(idParamSchema), validateQuery(analyticsDateRangeSchema)],
    handler: ctrl.getCounsellorDetail,
  })

  server.get('/analytics/students', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor')],
    handler: ctrl.listStudentAnalytics,
  })

  server.get('/analytics/students/:id', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(idParamSchema), validateQuery(analyticsDateRangeSchema)],
    handler: ctrl.getStudentAnalyticsDetail,
  })
}
