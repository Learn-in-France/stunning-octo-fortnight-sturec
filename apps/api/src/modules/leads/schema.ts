import { z } from 'zod'
import { leadFilterSchema } from '@sturec/shared/validation'

export const idParam = z.object({ id: z.string().uuid() })
export const assessmentIdParam = z.object({
  id: z.string().uuid(),
  assessmentId: z.string().uuid(),
})

export const createLeadSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  source: z.enum(['marketing', 'university', 'referral', 'whatsapp', 'ads', 'manual']),
  sourcePartner: z.string().optional(),
  notes: z.string().optional(),
})

export const updateLeadSchema = z.object({
  phone: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  notes: z.string().optional(),
  sourcePartner: z.string().optional(),
})

export const assignLeadSchema = z.object({
  counsellorId: z.string().uuid(),
})

export const disqualifyLeadSchema = z.object({
  reason: z.string().min(1),
})

export const importLeadsSchema = z.object({
  rows: z.array(z.object({
    email: z.string().email(),
    firstName: z.string().optional(),
    first_name: z.string().optional(),
    lastName: z.string().optional(),
    last_name: z.string().optional(),
    phone: z.string().optional(),
    sourcePartner: z.string().optional(),
    notes: z.string().optional(),
  }).passthrough()).min(1).max(1000),
})

export { leadFilterSchema }
