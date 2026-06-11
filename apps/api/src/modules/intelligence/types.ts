/**
 * Lead-intelligence experiment types & constants.
 *
 * Weights are the validated v1 heuristic (see docs/next-work-lead-intelligence.md):
 * commitment actions dominate; opens are recall, not precision.
 * Recency decay ~30 days so last-week intent beats last-quarter curiosity.
 */

import type { LeadEventType, LeadEventOrigin } from '@prisma/client'

export const EVENT_WEIGHTS: Record<LeadEventType, number> = {
  booking: 25,
  doc_upload: 20,
  wa_reply: 15,
  webinar_attend: 12,
  email_click: 3, // overridden per link category below
  chat_message: 7,
  call_logged: 5,
  email_open: 1,
}

/** Diagnostic link categories — clicks only mean something when the link does. */
export const CLICK_CATEGORY_WEIGHTS: Record<string, number> = {
  whatsapp: 8,
  booking: 8,
  scholarship: 8,
  programme: 5,
  podcast: 4,
  website: 3,
}

export const INTENT_DECAY_DAYS = 30
export const INTENT_CAP = 100

export interface NewLeadEvent {
  leadId: string
  eventType: LeadEventType
  origin: LeadEventOrigin
  occurredAt: Date
  linkCategory?: string
  metadata?: Record<string, unknown>
}

/** Classify a clicked URL into a diagnostic category. */
export function classifyLink(url: string): string {
  const u = url.toLowerCase()
  if (u.includes('unsubscribe')) return 'unsubscribe'
  if (u.includes('wa.me') || u.includes('whatsapp')) return 'whatsapp'
  if (u.includes('cal.com') || u.includes('/book')) return 'booking'
  if (u.includes('scholarship')) return 'scholarship'
  if (u.includes('/programs') || u.includes('/programmes') || u.includes('programme')) return 'programme'
  if (u.includes('/podcast')) return 'podcast'
  return 'website'
}

export function weightFor(eventType: LeadEventType, linkCategory?: string): number {
  if (eventType === 'email_click' && linkCategory) {
    if (linkCategory === 'unsubscribe') return 0
    return CLICK_CATEGORY_WEIGHTS[linkCategory] ?? EVENT_WEIGHTS.email_click
  }
  return EVENT_WEIGHTS[eventType]
}
