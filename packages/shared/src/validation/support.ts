import { z } from 'zod'

export const createSupportRequestSchema = z.object({
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  category: z.enum(['general', 'documents', 'application', 'visa', 'payment', 'technical']).default('general'),
})

export const supportRequestResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['received']),
  message: z.string(),
})
