import { z } from 'zod'

export const chatSessionStatusSchema = z.enum(['active', 'completed'])
export const messageRoleSchema = z.enum(['user', 'assistant', 'system'])

export const chatSessionItemSchema = z.object({
  id: z.string().uuid(),
  status: chatSessionStatusSchema,
  createdAt: z.string(),
  endedAt: z.string().nullable(),
})

export const chatMessageItemSchema = z.object({
  id: z.string().uuid(),
  role: messageRoleSchema,
  content: z.string(),
  timestamp: z.string(),
})

export const chatMessageResponseSchema = z.object({
  message: chatMessageItemSchema,
  options: z.array(z.string()).nullable(),
  shouldSuggestBooking: z.boolean(),
})

export const sendMessageSchema = z.object({
  content: z.string().min(1),
})
