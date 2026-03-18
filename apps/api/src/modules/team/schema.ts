import { z } from 'zod'

export const idParam = z.object({ id: z.string().uuid() })

export const inviteTeamMemberSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['counsellor', 'admin']),
})

export const updateTeamMemberSchema = z.object({
  role: z.enum(['counsellor', 'admin']).optional(),
  status: z.enum(['active', 'deactivated']).optional(),
})
