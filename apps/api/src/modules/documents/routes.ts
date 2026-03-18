import type { FastifyInstance } from 'fastify'

import { authMiddleware } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/rbac.js'
import { validateBody, validateParams } from '../../middleware/validation.js'
import * as ctrl from './controller.js'
import * as schema from './schema.js'

export async function documentRoutes(server: FastifyInstance) {
  // Student-scoped document routes
  server.get('/students/:id/documents', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor', 'student'), validateParams(schema.idParam)],
    handler: ctrl.listDocuments,
  })
  server.post('/students/:id/documents/upload-url', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor', 'student'), validateParams(schema.idParam), validateBody(schema.uploadUrlSchema)],
    handler: ctrl.requestUploadUrl,
  })
  server.post('/students/:id/documents/complete', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor', 'student'), validateParams(schema.idParam), validateBody(schema.completeUploadSchema)],
    handler: ctrl.completeUpload,
  })

  // Document-level actions (by document ID)
  server.get('/documents/:id/download', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor', 'student'), validateParams(schema.idParam)],
    handler: ctrl.downloadDocument,
  })
  server.post('/documents/:id/verify', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam), validateBody(schema.verifyRejectSchema)],
    handler: ctrl.verifyDocument,
  })
  server.post('/documents/:id/reject', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam), validateBody(schema.verifyRejectSchema)],
    handler: ctrl.rejectDocument,
  })
  server.delete('/documents/:id', {
    preHandler: [authMiddleware, requireRole('admin', 'student'), validateParams(schema.idParam)],
    handler: ctrl.deleteDocument,
  })

  // Document requirements
  server.get('/students/:id/document-requirements', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor', 'student'), validateParams(schema.idParam)],
    handler: ctrl.listRequirements,
  })
  server.post('/students/:id/document-requirements', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam), validateBody(schema.createRequirementSchema)],
    handler: ctrl.createRequirement,
  })
  server.patch('/document-requirements/:id', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam), validateBody(schema.updateRequirementSchema)],
    handler: ctrl.updateRequirement,
  })
}
