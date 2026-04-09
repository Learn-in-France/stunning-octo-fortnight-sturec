import { z } from 'zod'

const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  emailVerified: z.boolean(),
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

export const validateInviteSchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
})

export const validateInviteResponseSchema = z.object({
  email: z.string().email(),
  role: z.enum(['counsellor', 'admin']),
  firstName: z.string(),
  lastName: z.string(),
  expiresAt: z.string(),
})

export const acceptInviteRequestSchema = z.object({
  token: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
})

export type UserResponse = z.infer<typeof userResponseSchema>
