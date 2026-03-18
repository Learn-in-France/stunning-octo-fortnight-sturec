import type { FastifyInstance } from 'fastify'

import { authMiddleware } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/rbac.js'
import { validateBody, validateParams } from '../../middleware/validation.js'
import * as ctrl from './controller.js'
import * as schema from './schema.js'

export async function bookingRoutes(server: FastifyInstance) {
  server.get('/bookings', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor', 'student')],
    handler: ctrl.listBookings,
  })

  server.post('/bookings', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor', 'student'), validateBody(schema.createBookingSchema)],
    handler: ctrl.createBooking,
  })

  server.patch('/bookings/:id', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam), validateBody(schema.updateBookingSchema)],
    handler: ctrl.updateBooking,
  })
}
