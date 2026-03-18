import { z } from 'zod'

export const documentTypeSchema = z.enum([
  'passport', 'transcript', 'sop', 'financial_proof',
  'accommodation', 'offer_letter', 'other',
])

export const documentStatusSchema = z.enum([
  'pending_upload', 'pending', 'verified', 'rejected',
])

export const requirementSourceSchema = z.enum([
  'visa', 'admission', 'housing', 'custom',
])

export const requirementStatusSchema = z.enum([
  'missing', 'requested', 'uploaded', 'verified', 'rejected', 'waived',
])

export const documentListItemSchema = z.object({
  id: z.string().uuid(),
  type: documentTypeSchema,
  filename: z.string(),
  status: documentStatusSchema,
  isCurrent: z.boolean(),
  createdAt: z.string(),
})

export const documentRequirementItemSchema = z.object({
  id: z.string().uuid(),
  documentType: z.string(),
  requirementSource: requirementSourceSchema,
  required: z.boolean(),
  status: requirementStatusSchema,
  notes: z.string().nullable(),
  dueDate: z.string().nullable(),
})
