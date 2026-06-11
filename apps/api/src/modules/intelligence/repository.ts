/**
 * Intelligence repository — the ONLY place that touches lead_events /
 * intent_score / funnel_snapshots via Prisma (Hard Rule #7).
 *
 * Used by the intelligence service AND the workers (webhooks, intelligence).
 */

import prisma from '../../lib/prisma.js'
import { Prisma } from '@prisma/client'
import { INTENT_DECAY_DAYS, INTENT_CAP, weightFor, type NewLeadEvent } from './types.js'

/**
 * Resolve a Sturec lead from Mautic/Brevo identity.
 * Prefers mautic_contact_id, falls back to email (most recent non-deleted).
 */
export async function resolveLeadId(opts: {
  mauticContactId?: number
  email?: string
}): Promise<string | null> {
  if (opts.mauticContactId) {
    const byId = await prisma.lead.findFirst({
      where: { mauticContactId: opts.mauticContactId, deletedAt: null },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    })
    if (byId) return byId.id
  }
  if (opts.email) {
    const byEmail = await prisma.lead.findFirst({
      where: { email: { equals: opts.email, mode: 'insensitive' }, deletedAt: null },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    })
    if (byEmail) return byEmail.id
  }
  return null
}

/** Resolve a lead by phone — matches on the last 10 digits (Indian numbers). */
export async function resolveLeadIdByPhone(phone: string): Promise<string | null> {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) return null
  const last10 = digits.slice(-10)
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM leads
    WHERE deleted_at IS NULL
      AND regexp_replace(coalesce(phone, ''), '\\D', '', 'g') LIKE ${'%' + last10}
    ORDER BY created_at DESC
    LIMIT 1
  `
  return rows[0]?.id ?? null
}

/**
 * Record events idempotently. Duplicate (leadId, eventType, occurredAt, origin)
 * rows are silently skipped — retry-safe by construction.
 * Returns the number of NEW rows written.
 */
export async function recordEvents(events: NewLeadEvent[]): Promise<number> {
  if (!events.length) return 0
  const result = await prisma.leadEvent.createMany({
    data: events.map((e) => ({
      leadId: e.leadId,
      eventType: e.eventType,
      origin: e.origin,
      occurredAt: e.occurredAt,
      linkCategory: e.linkCategory,
      weight: weightFor(e.eventType, e.linkCategory),
      metadata: (e.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    })),
    skipDuplicates: true,
  })
  return result.count
}

/**
 * Recompute intent for one lead (or all leads with events when leadId omitted).
 * intent = min(CAP, round(Σ weight · exp(−age_days / DECAY)))
 */
export async function recomputeIntent(leadId?: string): Promise<number> {
  const where = leadId ? Prisma.sql`AND le.lead_id = ${leadId}::uuid` : Prisma.empty
  const updated = await prisma.$executeRaw`
    UPDATE leads l SET
      intent_score = sub.score,
      intent_updated_at = now()
    FROM (
      SELECT le.lead_id,
             LEAST(${INTENT_CAP}, ROUND(SUM(
               le.weight * EXP(-EXTRACT(EPOCH FROM (now() - le.occurred_at)) / 86400.0 / ${INTENT_DECAY_DAYS})
             ))::int) AS score
      FROM lead_events le
      WHERE 1=1 ${where}
      GROUP BY le.lead_id
    ) sub
    WHERE l.id = sub.lead_id
  `
  return updated
}

/** Ranked work queue: engaged, un-gated-out, current-cycle leads. */
export async function workQueue(opts: { limit: number; offset: number; intakeMax: number }) {
  const [rows, total] = await Promise.all([
    prisma.lead.findMany({
      where: {
        deletedAt: null,
        outcome: null,
        dqTags: { isEmpty: true },
        OR: [{ intakeYear: null }, { intakeYear: { lte: opts.intakeMax } }],
      },
      orderBy: [{ intentScore: { sort: 'desc', nulls: 'last' } }, { updatedAt: 'desc' }],
      take: opts.limit,
      skip: opts.offset,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        intentScore: true,
        programmeRequested: true,
        programmeInPortfolio: true,
        intakeYear: true,
        dqTags: true,
        sourcePartner: true,
        assignedCounsellor: { select: { id: true, firstName: true, lastName: true } },
        latestAiAssessment: {
          select: { leadHeat: true, programmeLevel: true, fieldsCollected: true },
        },
      },
    }),
    prisma.lead.count({
      where: {
        deletedAt: null,
        outcome: null,
        dqTags: { isEmpty: true },
        OR: [{ intakeYear: null }, { intakeYear: { lte: opts.intakeMax } }],
      },
    }),
  ])
  return { rows, total }
}

export async function getActiveProgrammeNames(): Promise<string[]> {
  const programmes = await prisma.program.findMany({
    where: { active: true },
    select: { name: true },
  })
  return programmes.map((p) => p.name)
}

export async function updateGate(
  leadId: string,
  data: {
    programmeRequested?: string | null
    programmeInPortfolio?: boolean | null
    intakeYear?: number | null
    fundingSelfPossible?: boolean | null
    franceReal?: boolean | null
    englishReady?: boolean | null
    contactValid?: boolean | null
    dqTags: string[]
  },
) {
  return prisma.lead.update({
    where: { id: leadId },
    data,
    select: { id: true, dqTags: true, programmeInPortfolio: true, intakeYear: true },
  })
}

export async function updateOutcome(leadId: string, outcome: string, reason?: string) {
  return prisma.lead.update({
    where: { id: leadId },
    data: {
      outcome: outcome as never,
      outcomeReason: reason,
      outcomeAt: new Date(),
    },
    select: { id: true, outcome: true, outcomeAt: true },
  })
}

export async function findLeadById(leadId: string) {
  return prisma.lead.findFirst({
    where: { id: leadId, deletedAt: null },
    select: { id: true, programmeRequested: true, programmeInPortfolio: true, intakeYear: true,
      fundingSelfPossible: true, franceReal: true, englishReady: true, contactValid: true },
  })
}

export async function getLeadEvents(leadId: string, limit = 50) {
  return prisma.leadEvent.findMany({
    where: { leadId },
    orderBy: { occurredAt: 'desc' },
    take: limit,
  })
}

/** Live funnel: stage counts per source (same definitions as the snapshot). */
export async function funnelLive() {
  return prisma.$queryRaw<
    Array<{ source_name: string; pool: bigint; engaged: bigint; gate_passed: bigint; applied: bigint; enrolled: bigint; disqualified: bigint }>
  >`
    SELECT COALESCE(ls.name, COALESCE(l.source_partner, '(none)')) AS source_name,
           count(*)::bigint AS pool,
           count(*) FILTER (WHERE l.intent_score > 0)::bigint AS engaged,
           count(*) FILTER (WHERE cardinality(l.dq_tags) = 0 AND l.programme_in_portfolio = true)::bigint AS gate_passed,
           count(*) FILTER (WHERE l.outcome = 'applied')::bigint AS applied,
           count(*) FILTER (WHERE l.outcome = 'enrolled')::bigint AS enrolled,
           count(*) FILTER (WHERE l.outcome IN ('disqualified','not_interested'))::bigint AS disqualified
    FROM leads l
    LEFT JOIN lead_sources ls ON ls.id = l.acquisition_source_id
    WHERE l.deleted_at IS NULL
    GROUP BY 1
    ORDER BY pool DESC
  `
}

/** Stage counts per acquisition source for the weekly funnel snapshot. */
export async function snapshotFunnel(weekStart: Date): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ source_name: string; stage: string; count: bigint }>>`
    WITH base AS (
      SELECT l.id,
             COALESCE(ls.name, COALESCE(l.source_partner, '')) AS source_name,
             l.intent_score, l.dq_tags, l.programme_in_portfolio, l.outcome
      FROM leads l
      LEFT JOIN lead_sources ls ON ls.id = l.acquisition_source_id
      WHERE l.deleted_at IS NULL
    )
    SELECT source_name, stage, count(*)::bigint AS count FROM (
      SELECT source_name, 'pool' AS stage FROM base
      UNION ALL
      SELECT source_name, 'engaged' FROM base WHERE intent_score > 0
      UNION ALL
      SELECT source_name, 'gate_passed' FROM base
        WHERE cardinality(dq_tags) = 0 AND programme_in_portfolio = true
      UNION ALL
      SELECT source_name, 'applied' FROM base WHERE outcome = 'applied'
      UNION ALL
      SELECT source_name, 'enrolled' FROM base WHERE outcome = 'enrolled'
      UNION ALL
      SELECT source_name, 'disqualified' FROM base WHERE outcome IN ('disqualified','not_interested')
    ) s
    GROUP BY source_name, stage
  `
  let written = 0
  for (const r of rows) {
    await prisma.funnelSnapshot.upsert({
      where: {
        weekStart_sourceName_stage: {
          weekStart,
          sourceName: r.source_name,
          stage: r.stage,
        },
      },
      create: { weekStart, sourceName: r.source_name, stage: r.stage, count: Number(r.count) },
      update: { count: Number(r.count) },
    })
    written++
  }
  return written
}
