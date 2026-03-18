import { z } from 'zod'

export const contactTypeSchema = z.enum(['parent', 'guardian', 'emergency'])

export const contactItemSchema = z.object({
  id: z.string().uuid(),
  contactType: contactTypeSchema,
  name: z.string(),
  relation: z.string(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  isPrimary: z.boolean(),
  createdAt: z.string(),
})

export const createContactSchema = z.object({
  contactType: contactTypeSchema,
  name: z.string().min(1),
  relation: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  isPrimary: z.boolean().default(false),
})

export const updateContactSchema = z.object({
  name: z.string().min(1).optional(),
  relation: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  isPrimary: z.boolean().optional(),
})
