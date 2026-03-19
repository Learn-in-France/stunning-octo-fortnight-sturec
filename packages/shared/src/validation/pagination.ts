import { z } from 'zod'

// ─── Pagination ───────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type PaginationInput = z.infer<typeof paginationSchema>

/** Wraps any item schema into a paginated response schema */
export function paginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    page: z.number(),
    limit: z.number(),
    total: z.number(),
  })
}

// ─── Filter Schemas ───────────────────────────────────────────

export const leadFilterSchema = paginationSchema.extend({
  status: z.enum(['new', 'nurturing', 'qualified', 'disqualified', 'converted']).optional(),
  source: z.enum(['marketing', 'university', 'referral', 'whatsapp', 'ads', 'manual']).optional(),
  assignedCounsellorId: z.string().uuid().optional(),
  qualificationMin: z.coerce.number().optional(),
  qualificationMax: z.coerce.number().optional(),
  priorityLevel: z.enum(['p1', 'p2', 'p3']).optional(),
  readyForAssignment: z.coerce.boolean().optional(),
  search: z.string().optional(),
})

export type LeadFilterInput = z.infer<typeof leadFilterSchema>

export const studentFilterSchema = paginationSchema.extend({
  stage: z.enum([
    'lead_created', 'intake_completed', 'qualified', 'counsellor_consultation',
    'application_started', 'offer_confirmed', 'campus_france_readiness',
    'visa_file_readiness', 'visa_submitted', 'visa_decision',
    'arrival_onboarding', 'arrived_france', 'alumni',
  ]).optional(),
  assignedCounsellorId: z.string().uuid().optional(),
  visaRisk: z.enum(['low', 'medium', 'high']).optional(),
  readinessMin: z.coerce.number().optional(),
  search: z.string().optional(),
})

export type StudentFilterInput = z.infer<typeof studentFilterSchema>

export const applicationFilterSchema = paginationSchema.extend({
  programId: z.string().uuid().optional(),
  universityId: z.string().uuid().optional(),
  status: z.enum(['draft', 'submitted', 'offer', 'rejected', 'enrolled']).optional(),
  intakeId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
})

export type ApplicationFilterInput = z.infer<typeof applicationFilterSchema>

export const publicCatalogFilterSchema = paginationSchema.extend({
  degree: z.string().optional(),
  field: z.string().optional(),
  city: z.string().optional(),
  intake: z.string().optional(),
  tuitionMin: z.coerce.number().optional(),
  tuitionMax: z.coerce.number().optional(),
})

export type PublicCatalogFilterInput = z.infer<typeof publicCatalogFilterSchema>

// ─── Analytics Date Range ─────────────────────────────────────

export const analyticsDateRangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
})

export type AnalyticsDateRangeInput = z.infer<typeof analyticsDateRangeSchema>
