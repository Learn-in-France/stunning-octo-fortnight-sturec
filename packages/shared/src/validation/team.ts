import { z } from 'zod'

export const teamMemberItemSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['student', 'counsellor', 'admin']),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  status: z.enum(['active', 'invited', 'deactivated']),
  createdAt: z.string(),
})
