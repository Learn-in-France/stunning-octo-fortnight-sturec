import { z } from 'zod'

const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['student', 'counsellor', 'admin']),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  status: z.enum(['active', 'invited', 'deactivated']),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const verifyResponseSchema = userResponseSchema

export const registerResponseSchema = userResponseSchema

export const acceptInviteResponseSchema = userResponseSchema

export type UserResponse = z.infer<typeof userResponseSchema>
