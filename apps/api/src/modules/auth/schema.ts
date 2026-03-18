import { z } from 'zod'

export const registerBodySchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
})
