import { z } from 'zod'
import { studentFilterSchema, stageChangeSchema } from '@sturec/shared/validation'

export const idParam = z.object({ id: z.string().uuid() })

export const updateStudentSchema = z.object({
  degreeLevel: z.string().optional(),
  bachelorDegree: z.string().optional(),
  gpa: z.number().optional(),
  graduationYear: z.number().int().optional(),
  workExperienceYears: z.number().int().optional(),
  studyGapYears: z.number().int().optional(),
  englishTestType: z.enum(['ielts', 'toefl', 'duolingo', 'none']).optional(),
  englishScore: z.number().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  fundingRoute: z.string().optional(),
  preferredCity: z.string().optional(),
  preferredIntake: z.string().optional(),
  housingNeeded: z.boolean().optional(),
})

export const assignStudentSchema = z.object({
  counsellorId: z.string().uuid(),
  reason: z.string().trim().min(1).max(2000).optional(),
})

export { studentFilterSchema, stageChangeSchema }
