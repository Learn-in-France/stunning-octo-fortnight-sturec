import type { FastifyInstance } from 'fastify'

import { authMiddleware } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/rbac.js'
import { validateBody, validateQuery, validateParams } from '../../middleware/validation.js'
import * as ctrl from './controller.js'
import * as schema from './schema.js'
import {
  paginationSchema,
  createActivitySchema,
  createNoteSchema,
  createContactSchema,
  updateContactSchema,
  createConsentEventSchema,
} from '@sturec/shared/validation'

const assessmentIdParam = schema.idParam.extend({
  assessmentId: schema.idParam.shape.id,
})

export async function studentRoutes(server: FastifyInstance) {
  // List
  server.get('/students', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateQuery(schema.studentFilterSchema)],
    handler: ctrl.listStudents,
  })

  // Detail
  server.get('/students/:id', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor', 'student'), validateParams(schema.idParam)],
    handler: ctrl.getStudent,
  })

  // Update
  server.patch('/students/:id', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor', 'student'), validateParams(schema.idParam), validateBody(schema.updateStudentSchema)],
    handler: ctrl.updateStudent,
  })

  // Progress (student-facing)
  server.get('/students/:id/progress', {
    preHandler: [authMiddleware, requireRole('admin', 'student'), validateParams(schema.idParam)],
    handler: ctrl.getProgress,
  })

  // Stage change
  server.post('/students/:id/stage', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam), validateBody(schema.stageChangeSchema)],
    handler: ctrl.changeStage,
  })

  // Timeline
  server.get('/students/:id/timeline', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam)],
    handler: ctrl.listTimeline,
  })

  // Assign counsellor
  server.post('/students/:id/assign', {
    preHandler: [authMiddleware, requireRole('admin'), validateParams(schema.idParam), validateBody(schema.assignStudentSchema)],
    handler: ctrl.assignCounsellor,
  })

  // Assignment history
  server.get('/students/:id/assignments', {
    preHandler: [authMiddleware, requireRole('admin'), validateParams(schema.idParam)],
    handler: ctrl.listAssignments,
  })

  // Notes
  server.get('/students/:id/notes', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam), validateQuery(paginationSchema)],
    handler: ctrl.listNotes,
  })
  server.post('/students/:id/notes', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam), validateBody(createNoteSchema)],
    handler: ctrl.createNote,
  })

  // Activities
  server.get('/students/:id/activities', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam), validateQuery(paginationSchema)],
    handler: ctrl.listActivities,
  })
  server.post('/students/:id/activities', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam), validateBody(createActivitySchema)],
    handler: ctrl.createActivity,
  })

  // Contacts
  server.get('/students/:id/contacts', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor', 'student'), validateParams(schema.idParam)],
    handler: ctrl.listContacts,
  })
  server.post('/students/:id/contacts', {
    preHandler: [authMiddleware, requireRole('admin', 'student'), validateParams(schema.idParam), validateBody(createContactSchema)],
    handler: ctrl.createContact,
  })

  // Consents
  server.get('/students/:id/consents', {
    preHandler: [authMiddleware, requireRole('admin', 'student'), validateParams(schema.idParam)],
    handler: ctrl.listConsents,
  })
  server.post('/students/:id/consents', {
    preHandler: [authMiddleware, requireRole('admin', 'student'), validateParams(schema.idParam), validateBody(createConsentEventSchema)],
    handler: ctrl.createConsent,
  })

  // Contacts — update (top-level route per API contract)
  server.patch('/student-contacts/:id', {
    preHandler: [authMiddleware, requireRole('admin', 'student'), validateParams(schema.idParam), validateBody(updateContactSchema)],
    handler: ctrl.updateContact,
  })

  // AI Assessments
  server.get('/students/:id/ai-assessments', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam)],
    handler: ctrl.listAssessments,
  })
  server.get('/students/:id/ai-assessments/:assessmentId', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(assessmentIdParam)],
    handler: ctrl.getAssessment,
  })
}
