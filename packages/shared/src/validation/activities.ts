import { z } from 'zod'

export const activityTypeSchema = z.enum([
  'call', 'whatsapp', 'email', 'meeting', 'follow_up', 'status_update', 'other',
])

export const activityChannelSchema = z.enum([
  'phone', 'whatsapp', 'email', 'video', 'in_person', 'internal', 'other',
])

export const activityDirectionSchema = z.enum(['outbound', 'inbound', 'internal'])

export const activityLogItemSchema = z.object({
  id: z.string().uuid(),
  activityType: activityTypeSchema,
  channel: activityChannelSchema,
  direction: activityDirectionSchema,
  outcome: z.string().nullable(),
  summary: z.string().nullable(),
  nextActionDueAt: z.string().nullable(),
  durationMinutes: z.number().nullable(),
  createdAt: z.string(),
  createdBy: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
})

export const createActivitySchema = z.object({
  activityType: activityTypeSchema,
  channel: activityChannelSchema,
  direction: activityDirectionSchema,
  outcome: z.string().optional(),
  summary: z.string().optional(),
  nextActionDueAt: z.string().optional(),
  durationMinutes: z.number().int().min(0).optional(),
})
