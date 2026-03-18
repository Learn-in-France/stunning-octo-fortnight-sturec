import { z } from 'zod'
import { paginationSchema, publicCatalogFilterSchema } from '@sturec/shared/validation'

// ─── Param schemas ────────────────────────────────────────────

export const idParam = z.object({ id: z.string().uuid() })
export const programIdParam = z.object({ id: z.string().uuid() })

// ─── University ───────────────────────────────────────────────

export const createUniversitySchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  country: z.string().default('France'),
  websiteUrl: z.string().url().optional(),
  partnerStatus: z.string().optional(),
  notes: z.string().optional(),
})

export const updateUniversitySchema = createUniversitySchema.partial()

// ─── Program ──────────────────────────────────────────────────

export const createProgramSchema = z.object({
  universityId: z.string().uuid(),
  name: z.string().min(1),
  degreeLevel: z.string().min(1),
  fieldOfStudy: z.string().min(1),
  language: z.string().default('English'),
  durationMonths: z.number().int().min(1),
  tuitionAmount: z.number().int().min(0),
  tuitionCurrency: z.string().default('EUR'),
  minimumGpa: z.number().optional(),
  englishRequirementType: z.string().optional(),
  englishMinimumScore: z.number().optional(),
  description: z.string().optional(),
})

export const updateProgramSchema = createProgramSchema.partial()

// ─── Program Intake ───────────────────────────────────────────

export const createIntakeSchema = z.object({
  intakeName: z.string().min(1),
  startMonth: z.number().int().min(1).max(12),
  startYear: z.number().int().min(2024),
  applicationDeadline: z.string().optional(),
})

export const updateIntakeSchema = createIntakeSchema.partial()

// ─── Visa Requirement ─────────────────────────────────────────

export const createVisaRequirementSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  documentType: z.string().min(1),
  required: z.boolean().default(true),
  countrySpecific: z.string().optional(),
  stageApplicable: z.string().optional(),
  sortOrder: z.number().int().default(0),
})

export const updateVisaRequirementSchema = createVisaRequirementSchema.partial()

// ─── Eligibility Rule ─────────────────────────────────────────

export const createEligibilityRuleSchema = z.object({
  programId: z.string().uuid().optional(),
  ruleName: z.string().min(1),
  field: z.string().min(1),
  operator: z.string().min(1),
  value: z.string().min(1),
  valueType: z.enum(['number', 'string', 'boolean', 'enum']),
  ruleScope: z.string().optional(),
  description: z.string().optional(),
})

export const updateEligibilityRuleSchema = createEligibilityRuleSchema.partial()

// ─── Campus France Prep ───────────────────────────────────────

export const createCampusFrancePrepSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.string().min(1),
  sortOrder: z.number().int().default(0),
})

export const updateCampusFrancePrepSchema = createCampusFrancePrepSchema.partial()

// ─── Query schemas ────────────────────────────────────────────

export { paginationSchema, publicCatalogFilterSchema }
