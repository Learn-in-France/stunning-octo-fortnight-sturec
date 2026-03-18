import { z } from 'zod'
import {
  documentTypeSchema,
  requirementSourceSchema,
  requirementStatusSchema,
} from '@sturec/shared/validation'

export const idParam = z.object({ id: z.string().uuid() })

export const uploadUrlSchema = z.object({
  type: documentTypeSchema,
  filename: z.string().min(1),
})

export const completeUploadSchema = z.object({
  documentId: z.string().uuid(),
})

export const verifyRejectSchema = z.object({
  notes: z.string().optional(),
})

export const createRequirementSchema = z.object({
  documentType: z.string().min(1),
  requirementSource: requirementSourceSchema,
  required: z.boolean().default(true),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
})

export const updateRequirementSchema = z.object({
  status: requirementStatusSchema.optional(),
  notes: z.string().optional(),
  required: z.boolean().optional(),
})
