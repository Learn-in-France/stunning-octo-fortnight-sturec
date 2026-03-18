import { z } from 'zod'

// ─── User profile update (any role) ─────────────────────────

export const updateUserProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
})

// ─── Student notification preferences ───────────────────────

export const notificationPreferencesSchema = z.object({
  whatsappConsent: z.boolean(),
  emailConsent: z.boolean(),
})

export const updateNotificationPreferencesSchema = z.object({
  whatsappConsent: z.boolean().optional(),
  emailConsent: z.boolean().optional(),
})
