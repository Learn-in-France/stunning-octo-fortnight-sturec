/**
 * Zod schemas for the intelligence module.
 */

import { z } from 'zod'

export const idParam = z.object({ id: z.string().uuid() })

export const workQueueQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  /** include leads with intake_year <= this (default: current cycle year) */
  intakeMax: z.coerce.number().int().optional(),
})

/**
 * 6-question gate (binary disqualifiers — NOT graded profile scoring;
 * see docs/lead-qualification-gate.md). All fields optional so the form
 * can be filled progressively; null = unknown = no tag.
 */
export const gateSchema = z.object({
  programmeRequested: z.string().max(200).nullish(),
  programmeInPortfolio: z.boolean().nullish(),
  intakeYear: z.number().int().min(2024).max(2035).nullish(),
  fundingSelfPossible: z.boolean().nullish(),
  franceReal: z.boolean().nullish(),
  englishReady: z.boolean().nullish(),
  contactValid: z.boolean().nullish(),
})

export const outcomeSchema = z.object({
  outcome: z.enum([
    'applied',
    'enrolled',
    'deferred_next_cycle',
    'disqualified',
    'not_interested',
    'unreachable',
  ]),
  reason: z.string().max(500).optional(),
})

/** Manual signal logging (e.g. counsellor logs a WhatsApp reply or call). */
export const manualEventSchema = z.object({
  eventType: z.enum(['wa_reply', 'call_logged', 'webinar_attend', 'doc_upload']),
  occurredAt: z.coerce.date().optional(),
  note: z.string().max(500).optional(),
})

export type GateInput = z.infer<typeof gateSchema>
export type OutcomeInput = z.infer<typeof outcomeSchema>
export type ManualEventInput = z.infer<typeof manualEventSchema>
export type WorkQueueQuery = z.infer<typeof workQueueQuerySchema>
