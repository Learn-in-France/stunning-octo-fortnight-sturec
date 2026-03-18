/**
 * Enum mapping layer.
 *
 * Prisma generates TypeScript identifiers that cannot use reserved words or
 * collide with other enum members.  Where an identifier diverges from the
 * database / public-contract value the Prisma schema uses `@map("...")`.
 *
 * This module translates every divergent Prisma enum identifier into the
 * canonical string that `@sturec/shared` types expose. Non-divergent values
 * pass through unchanged.
 */

import type {
  LeadStatus as PrismaLeadStatus,
  ActivityChannel as PrismaActivityChannel,
  ConsentType as PrismaConsentType,
  ValueType as PrismaValueType,
} from '@prisma/client'

import type { LeadStatus } from '@sturec/shared'
import type { ActivityChannel, ConsentType, ValueType } from '@sturec/shared'

// ─── LeadStatus ─────────────────────────────────────────────────

const LEAD_STATUS_MAP: Record<PrismaLeadStatus, LeadStatus> = {
  new_lead: 'new',
  nurturing: 'nurturing',
  qualified: 'qualified',
  disqualified: 'disqualified',
  converted: 'converted',
}

export function mapLeadStatus(prismaValue: PrismaLeadStatus): LeadStatus {
  return LEAD_STATUS_MAP[prismaValue]
}

// ─── ActivityChannel ────────────────────────────────────────────

const ACTIVITY_CHANNEL_MAP: Record<PrismaActivityChannel, ActivityChannel> = {
  phone: 'phone',
  whatsapp_channel: 'whatsapp',
  email_channel: 'email',
  video: 'video',
  in_person: 'in_person',
  internal: 'internal',
  other: 'other',
}

export function mapActivityChannel(prismaValue: PrismaActivityChannel): ActivityChannel {
  return ACTIVITY_CHANNEL_MAP[prismaValue]
}

// ─── ConsentType ────────────────────────────────────────────────

const CONSENT_TYPE_MAP: Record<PrismaConsentType, ConsentType> = {
  whatsapp_consent: 'whatsapp',
  email_consent: 'email',
  parent_contact: 'parent_contact',
}

export function mapConsentType(prismaValue: PrismaConsentType): ConsentType {
  return CONSENT_TYPE_MAP[prismaValue]
}

// ─── ValueType ──────────────────────────────────────────────────

const VALUE_TYPE_MAP: Record<PrismaValueType, ValueType> = {
  number: 'number',
  string: 'string',
  boolean: 'boolean',
  enum_type: 'enum',
}

export function mapValueType(prismaValue: PrismaValueType): ValueType {
  return VALUE_TYPE_MAP[prismaValue]
}
