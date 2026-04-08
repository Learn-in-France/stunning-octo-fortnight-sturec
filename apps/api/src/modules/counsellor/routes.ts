import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { authMiddleware } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/rbac.js'
import { validateBody, validateParams } from '../../middleware/validation.js'
import * as ctrl from './controller.js'

const idParam = z.object({ id: z.string().uuid() })
const studentIdParam = z.object({ studentId: z.string().uuid() })

const meetingOutcomeSchema = z.object({
  bookingId: z.string().uuid(),
  outcome: z.enum(['qualified', 'needs_follow_up', 'not_ready', 'disqualified']),
  nextAction: z.string().min(1),
  followUpDueAt: z.string().optional(),
  privateNote: z.string().optional(),
  stageAfter: z.string().optional(),
})

const createReminderSchema = z.object({
  studentId: z.string().uuid(),
  title: z.string().min(1).max(255),
  dueAt: z.string(),
  source: z.string().optional(),
})

export async function counsellorRoutes(server: FastifyInstance) {
  const preHandler = [authMiddleware, requireRole('admin', 'counsellor')]

  // ── Agenda ──
  server.get('/counsellor/agenda', { preHandler, handler: ctrl.getAgenda })

  // ── Meeting outcomes ──
  server.post('/students/:studentId/meeting-outcome', {
    preHandler: [...preHandler, validateParams(studentIdParam), validateBody(meetingOutcomeSchema)],
    handler: ctrl.recordMeetingOutcome,
  })
  server.get('/students/:studentId/meeting-outcomes', {
    preHandler: [...preHandler, validateParams(studentIdParam)],
    handler: ctrl.getMeetingOutcomes,
  })

  // ── Reminders ──
  server.get('/counsellor/reminders', { preHandler, handler: ctrl.getReminders })
  server.post('/counsellor/reminders', {
    preHandler: [...preHandler, validateBody(createReminderSchema)],
    handler: ctrl.createReminder,
  })
  server.post('/counsellor/reminders/:id/complete', {
    preHandler: [...preHandler, validateParams(idParam)],
    handler: ctrl.completeReminder,
  })
  server.post('/counsellor/reminders/:id/dismiss', {
    preHandler: [...preHandler, validateParams(idParam)],
    handler: ctrl.dismissReminder,
  })
}
