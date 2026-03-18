import type { FastifyInstance } from 'fastify'

import { authMiddleware } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/rbac.js'
import { validateBody, validateQuery, validateParams } from '../../middleware/validation.js'
import * as ctrl from './controller.js'
import * as schema from './schema.js'

export async function catalogRoutes(server: FastifyInstance) {
  // ─── Universities ──────────────────────────────────────────
  server.get('/catalog/universities', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateQuery(schema.paginationSchema)],
    handler: ctrl.listUniversities,
  })
  server.get('/catalog/universities/:id', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam)],
    handler: ctrl.getUniversity,
  })
  server.post('/catalog/universities', {
    preHandler: [authMiddleware, requireRole('admin'), validateBody(schema.createUniversitySchema)],
    handler: ctrl.createUniversity,
  })
  server.patch('/catalog/universities/:id', {
    preHandler: [authMiddleware, requireRole('admin'), validateParams(schema.idParam), validateBody(schema.updateUniversitySchema)],
    handler: ctrl.updateUniversity,
  })

  // ─── Programs ──────────────────────────────────────────────
  server.get('/catalog/programs', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateQuery(schema.paginationSchema)],
    handler: ctrl.listPrograms,
  })
  server.get('/catalog/programs/:id', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam)],
    handler: ctrl.getProgram,
  })
  server.post('/catalog/programs', {
    preHandler: [authMiddleware, requireRole('admin'), validateBody(schema.createProgramSchema)],
    handler: ctrl.createProgram,
  })
  server.patch('/catalog/programs/:id', {
    preHandler: [authMiddleware, requireRole('admin'), validateParams(schema.idParam), validateBody(schema.updateProgramSchema)],
    handler: ctrl.updateProgram,
  })

  // ─── Program Intakes ───────────────────────────────────────
  server.get('/catalog/programs/:id/intakes', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam)],
    handler: ctrl.listIntakes,
  })
  server.post('/catalog/programs/:id/intakes', {
    preHandler: [authMiddleware, requireRole('admin'), validateParams(schema.idParam), validateBody(schema.createIntakeSchema)],
    handler: ctrl.createIntake,
  })
  server.patch('/catalog/intakes/:id', {
    preHandler: [authMiddleware, requireRole('admin'), validateParams(schema.idParam), validateBody(schema.updateIntakeSchema)],
    handler: ctrl.updateIntake,
  })

  // ─── Visa Requirements ─────────────────────────────────────
  server.get('/catalog/visa-requirements', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateQuery(schema.paginationSchema)],
    handler: ctrl.listVisaRequirements,
  })
  server.get('/catalog/visa-requirements/:id', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam)],
    handler: ctrl.getVisaRequirement,
  })
  server.post('/catalog/visa-requirements', {
    preHandler: [authMiddleware, requireRole('admin'), validateBody(schema.createVisaRequirementSchema)],
    handler: ctrl.createVisaRequirement,
  })
  server.patch('/catalog/visa-requirements/:id', {
    preHandler: [authMiddleware, requireRole('admin'), validateParams(schema.idParam), validateBody(schema.updateVisaRequirementSchema)],
    handler: ctrl.updateVisaRequirement,
  })

  // ─── Eligibility Rules ─────────────────────────────────────
  server.get('/catalog/eligibility-rules', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateQuery(schema.paginationSchema)],
    handler: ctrl.listEligibilityRules,
  })
  server.get('/catalog/eligibility-rules/:id', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam)],
    handler: ctrl.getEligibilityRule,
  })
  server.post('/catalog/eligibility-rules', {
    preHandler: [authMiddleware, requireRole('admin'), validateBody(schema.createEligibilityRuleSchema)],
    handler: ctrl.createEligibilityRule,
  })
  server.patch('/catalog/eligibility-rules/:id', {
    preHandler: [authMiddleware, requireRole('admin'), validateParams(schema.idParam), validateBody(schema.updateEligibilityRuleSchema)],
    handler: ctrl.updateEligibilityRule,
  })

  // ─── Campus France Prep ────────────────────────────────────
  server.get('/catalog/campus-france-prep', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateQuery(schema.paginationSchema)],
    handler: ctrl.listCampusFrancePreps,
  })
  server.get('/catalog/campus-france-prep/:id', {
    preHandler: [authMiddleware, requireRole('admin', 'counsellor'), validateParams(schema.idParam)],
    handler: ctrl.getCampusFrancePrep,
  })
  server.post('/catalog/campus-france-prep', {
    preHandler: [authMiddleware, requireRole('admin'), validateBody(schema.createCampusFrancePrepSchema)],
    handler: ctrl.createCampusFrancePrep,
  })
  server.patch('/catalog/campus-france-prep/:id', {
    preHandler: [authMiddleware, requireRole('admin'), validateParams(schema.idParam), validateBody(schema.updateCampusFrancePrepSchema)],
    handler: ctrl.updateCampusFrancePrep,
  })
}

// ─── Public Catalog Routes (No Auth) ─────────────────────────

export async function publicCatalogRoutes(server: FastifyInstance) {
  server.get('/public/programs', {
    preHandler: [validateQuery(schema.publicCatalogFilterSchema)],
    handler: ctrl.listPublicPrograms,
  })
  server.get('/public/programs/:id', {
    preHandler: [validateParams(schema.idParam)],
    handler: ctrl.getPublicProgram,
  })
  server.get('/public/universities', {
    preHandler: [validateQuery(schema.paginationSchema)],
    handler: ctrl.listPublicUniversities,
  })
  server.get('/public/universities/:id', {
    preHandler: [validateParams(schema.idParam)],
    handler: ctrl.getPublicUniversity,
  })
}
