import { z } from 'zod'

export const noteItemSchema = z.object({
  id: z.string().uuid(),
  noteType: z.string(),
  content: z.string(),
  createdByUserId: z.string().uuid(),
  createdByName: z.string(),
  createdAt: z.string(),
})

export const createNoteSchema = z.object({
  noteType: z.string().default('general'),
  content: z.string().min(1),
})
