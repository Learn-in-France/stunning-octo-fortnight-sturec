import { z } from 'zod'

export const applicationStatusSchema = z.enum([
  'draft', 'submitted', 'offer', 'rejected', 'enrolled',
])

export const applicationListItemSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
  programId: z.string().uuid(),
  programName: z.string(),
  universityName: z.string(),
  intakeId: z.string().uuid().nullable(),
  intakeName: z.string().nullable(),
  status: applicationStatusSchema,
  submittedAt: z.string().nullable(),
  decisionAt: z.string().nullable(),
  createdAt: z.string(),
})
