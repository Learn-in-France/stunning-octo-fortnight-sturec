import { z } from 'zod'
import { priorityLevelSchema } from './leads'
import { visaRiskSchema } from './students'

export const aiAssessmentSummarySchema = z.object({
  id: z.string().uuid(),
  sourceType: z.string(),
  academicFitScore: z.number().nullable(),
  financialReadinessScore: z.number().nullable(),
  languageReadinessScore: z.number().nullable(),
  motivationClarityScore: z.number().nullable(),
  timelineUrgencyScore: z.number().nullable(),
  documentReadinessScore: z.number().nullable(),
  visaComplexityScore: z.number().nullable(),
  visaRisk: visaRiskSchema.nullable(),
  overallReadinessScore: z.number().nullable(),
  qualificationScore: z.number().nullable(),
  priorityLevel: priorityLevelSchema.nullable(),
  recommendedDisposition: z.string().nullable(),
  summaryForTeam: z.string(),
  profileCompleteness: z.number().nullable(),
  createdAt: z.string(),
})
