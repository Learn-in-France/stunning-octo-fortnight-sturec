import { z } from 'zod'

export const rsvpSchema = z.object({
  token: z.string().optional().nullable(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional(),
  city: z.string().max(100).optional(),
  programme: z.string().max(200).optional(),
  intake: z.enum(['sept_2026', 'jan_2027', 'sept_2027', 'undecided']),
  mauticId: z.number().int().positive().optional(),
})

export type RsvpInput = z.infer<typeof rsvpSchema>

export const INTAKE_LABELS: Record<RsvpInput['intake'], string> = {
  sept_2026: 'September 2026',
  jan_2027: 'January 2027',
  sept_2027: 'September 2027',
  undecided: 'Still deciding',
}
