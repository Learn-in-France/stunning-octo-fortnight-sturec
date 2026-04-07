import { z } from 'zod'

// ─── Enum schemas ─────────────────────────────────────────────

export const leadSourceSchema = z.enum([
  'marketing', 'university', 'referral', 'whatsapp', 'ads', 'manual',
])

export const leadStatusSchema = z.enum([
  'new', 'nurturing', 'qualified', 'disqualified', 'converted',
])

export const priorityLevelSchema = z.enum(['p1', 'p2', 'p3'])

// ─── Response DTOs ────────────────────────────────────────────

export const leadListItemSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  phone: z.string().nullable(),
  firstName: z.string(),
  lastName: z.string().nullable(),
  source: leadSourceSchema,
  sourcePartner: z.string().nullable(),
  status: leadStatusSchema,
  qualificationScore: z.number().nullable(),
  priorityLevel: priorityLevelSchema.nullable(),
  profileCompleteness: z.number().nullable(),
  isPartnerHotLead: z.boolean(),
  needsIntakeCompletion: z.boolean(),
  assignedCounsellorId: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const leadQualificationBlockSchema = z.object({
  qualificationScore: z.number().nullable(),
  priorityLevel: priorityLevelSchema.nullable(),
  profileCompleteness: z.number().nullable(),
  recommendedDisposition: z.string().nullable(),
  componentScores: z.object({
    academicFitScore: z.number().nullable(),
    financialReadinessScore: z.number().nullable(),
    languageReadinessScore: z.number().nullable(),
    motivationClarityScore: z.number().nullable(),
    timelineUrgencyScore: z.number().nullable(),
    documentReadinessScore: z.number().nullable(),
    visaComplexityScore: z.number().nullable(),
  }).nullable(),
  summaryForTeam: z.string().nullable(),
})

export const leadDetailSchema = leadListItemSchema.extend({
  userId: z.string().uuid().nullable(),
  notes: z.string().nullable(),
  mauticContactId: z.number().nullable(),
  convertedStudentId: z.string().uuid().nullable(),
  qualifiedAt: z.string().nullable(),
  priorityUpdatedAt: z.string().nullable(),
  createdByUserId: z.string().uuid().nullable(),
  qualification: leadQualificationBlockSchema.nullable(),
})
