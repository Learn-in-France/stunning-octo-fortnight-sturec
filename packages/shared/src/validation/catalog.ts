import { z } from 'zod'

export const universityItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  city: z.string(),
  country: z.string(),
  websiteUrl: z.string().nullable(),
  partnerStatus: z.string().nullable(),
  active: z.boolean(),
  createdAt: z.string(),
})

export const programItemSchema = z.object({
  id: z.string().uuid(),
  universityId: z.string().uuid(),
  universityName: z.string(),
  name: z.string(),
  degreeLevel: z.string(),
  fieldOfStudy: z.string(),
  language: z.string(),
  durationMonths: z.number(),
  tuitionAmount: z.number(),
  tuitionCurrency: z.string(),
  minimumGpa: z.number().nullable(),
  englishRequirementType: z.string().nullable(),
  englishMinimumScore: z.number().nullable(),
  description: z.string().nullable(),
  active: z.boolean(),
})

export const programIntakeItemSchema = z.object({
  id: z.string().uuid(),
  programId: z.string().uuid(),
  intakeName: z.string(),
  startMonth: z.number(),
  startYear: z.number(),
  applicationDeadline: z.string().nullable(),
  active: z.boolean(),
})

export const uploadUrlResponseSchema = z.object({
  uploadUrl: z.string(),
  documentId: z.string(),
  gcsPath: z.string(),
})

export const notificationChannelSchema = z.enum(['email', 'whatsapp', 'sms'])
export const notificationStatusSchema = z.enum(['pending', 'sent', 'delivered', 'failed'])

export const notificationItemSchema = z.object({
  id: z.string().uuid(),
  channel: notificationChannelSchema,
  status: notificationStatusSchema,
  subject: z.string().nullable(),
  sentAt: z.string().nullable(),
  createdAt: z.string(),
})

export const assignmentHistoryItemSchema = z.object({
  id: z.string().uuid(),
  counsellorId: z.string().uuid(),
  counsellorName: z.string(),
  assignedAt: z.string(),
  unassignedAt: z.string().nullable(),
})
