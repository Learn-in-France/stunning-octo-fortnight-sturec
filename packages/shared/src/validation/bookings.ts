import { z } from 'zod'

export const bookingStatusSchema = z.enum(['scheduled', 'completed', 'cancelled', 'no_show', 'awaiting_assignment', 'assigned'])

export const bookingListItemSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid().nullable(),
  leadId: z.string().uuid().nullable(),
  counsellorId: z.string().uuid().nullable(),
  scheduledAt: z.string(),
  status: bookingStatusSchema,
  notes: z.string().nullable(),
  createdAt: z.string(),
})

export const createBookingSchema = z.object({
  studentId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  counsellorId: z.string().uuid().optional().nullable(),
  scheduledAt: z.string(),
  notes: z.string().optional(),
  source: z.enum(['chat', 'portal']).optional(),
})

export const updateBookingSchema = z.object({
  status: bookingStatusSchema.optional(),
  notes: z.string().optional(),
  scheduledAt: z.string().optional(),
})
