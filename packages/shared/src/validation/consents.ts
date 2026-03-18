import { z } from 'zod'

export const consentTypeSchema = z.enum(['whatsapp', 'email', 'parent_contact'])
export const consentSourceSchema = z.enum(['form', 'manual', 'import', 'webhook'])

export const consentEventItemSchema = z.object({
  id: z.string().uuid(),
  consentType: consentTypeSchema,
  granted: z.boolean(),
  source: consentSourceSchema,
  recordedByUserId: z.string().uuid().nullable(),
  createdAt: z.string(),
})

export const createConsentEventSchema = z.object({
  consentType: consentTypeSchema,
  granted: z.boolean(),
  source: consentSourceSchema.default('form'),
})
