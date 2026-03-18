import { z } from 'zod'
import { applicationStatusSchema } from '@sturec/shared/validation'

export const idParam = z.object({ id: z.string().uuid() })

export const createApplicationSchema = z.object({
  programId: z.string().uuid(),
  intakeId: z.string().uuid().optional(),
  notes: z.string().optional(),
})

export const updateApplicationStatusSchema = z.object({
  status: applicationStatusSchema,
})
