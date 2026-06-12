/**
 * Intelligence service — work queue, 6Q gate, outcomes, funnel.
 *
 * Gate philosophy (validated on labelled outcomes, see
 * docs/lead-qualification-gate.md): binary circumstance disqualifiers,
 * never graded profile fit. Intent ranks who to reach; the gate decides
 * who is real.
 */

import * as repo from './repository.js'
import { getIntelligenceQueue } from '../../lib/queue/index.js'
import type { GateInput, OutcomeInput, ManualEventInput, WorkQueueQuery } from './schema.js'

const CURRENT_CYCLE_MAX_YEAR = 2026

/** Derive disqualifier tags from gate answers. null/undefined = unknown = no tag. */
export function deriveDqTags(gate: GateInput): string[] {
  const tags: string[] = []
  if (gate.programmeInPortfolio === false) tags.push('prog_not_offered')
  if (gate.intakeYear != null && gate.intakeYear > CURRENT_CYCLE_MAX_YEAR) tags.push('timing_2027+')
  if (gate.fundingSelfPossible === false) tags.push('scholarship_only')
  if (gate.franceReal === false) tags.push('france_weak')
  if (gate.englishReady === false) tags.push('english_weak')
  if (gate.contactValid === false) tags.push('dead_contact')
  return tags
}

export async function getWorkQueue(query: WorkQueueQuery) {
  const { rows, total } = await repo.workQueue({
    limit: query.limit,
    offset: query.offset,
    intakeMax: query.intakeMax ?? CURRENT_CYCLE_MAX_YEAR,
  })
  return { items: rows, total, limit: query.limit, offset: query.offset }
}

export async function applyGate(leadId: string, input: GateInput) {
  const existing = await repo.findLeadById(leadId)
  if (!existing) return null

  // Merge: only overwrite answers actually provided; recompute tags on the merged state
  const merged: GateInput = {
    programmeRequested: input.programmeRequested !== undefined ? input.programmeRequested : existing.programmeRequested,
    programmeInPortfolio: input.programmeInPortfolio !== undefined ? input.programmeInPortfolio : existing.programmeInPortfolio,
    intakeYear: input.intakeYear !== undefined ? input.intakeYear : existing.intakeYear,
    fundingSelfPossible: input.fundingSelfPossible !== undefined ? input.fundingSelfPossible : existing.fundingSelfPossible,
    franceReal: input.franceReal !== undefined ? input.franceReal : existing.franceReal,
    englishReady: input.englishReady !== undefined ? input.englishReady : existing.englishReady,
    contactValid: input.contactValid !== undefined ? input.contactValid : existing.contactValid,
  }

  // Auto-resolve portfolio membership when a programme is named but membership unknown
  if (merged.programmeRequested && merged.programmeInPortfolio == null) {
    const active = await repo.getActiveProgrammeNames()
    const req = merged.programmeRequested.toLowerCase()
    merged.programmeInPortfolio = active.some(
      (name) => name.toLowerCase() === req || name.toLowerCase().includes(req) || req.includes(name.toLowerCase()),
    )
  }

  return repo.updateGate(leadId, { ...merged, dqTags: deriveDqTags(merged) })
}

export async function recordOutcome(leadId: string, input: OutcomeInput) {
  const existing = await repo.findLeadById(leadId)
  if (!existing) return null
  return repo.updateOutcome(leadId, input.outcome, input.reason)
}

export async function logManualEvent(leadId: string, input: ManualEventInput) {
  const existing = await repo.findLeadById(leadId)
  if (!existing) return null

  // Debounce: identical manual event within 10 minutes = double-tap, not new signal
  const recent = await repo.getLeadEvents(leadId, 10)
  const cutoff = Date.now() - 10 * 60 * 1000
  if (recent.some((e) => e.eventType === input.eventType && e.origin === 'manual' && e.occurredAt.getTime() > cutoff)) {
    return { recorded: 0, deduped: true }
  }

  const written = await repo.recordEvents([
    {
      leadId,
      eventType: input.eventType,
      origin: 'manual',
      occurredAt: input.occurredAt ?? new Date(),
      metadata: input.note ? { note: input.note } : undefined,
    },
  ])
  if (written > 0) {
    await getIntelligenceQueue().add('intent-recompute', { task: 'intent_recompute', leadId })
  }
  return { recorded: written }
}

export async function getLeadTimeline(leadId: string) {
  const existing = await repo.findLeadById(leadId)
  if (!existing) return null
  return repo.getLeadEvents(leadId)
}

export async function getFunnel() {
  const rows = await repo.funnelLive()
  const sources = rows.map((r) => ({
    source: r.source_name,
    pool: Number(r.pool),
    engaged: Number(r.engaged),
    gatePassed: Number(r.gate_passed),
    applied: Number(r.applied),
    enrolled: Number(r.enrolled),
    disqualified: Number(r.disqualified),
  }))
  const totals = sources.reduce(
    (acc, s) => ({
      source: 'TOTAL',
      pool: acc.pool + s.pool,
      engaged: acc.engaged + s.engaged,
      gatePassed: acc.gatePassed + s.gatePassed,
      applied: acc.applied + s.applied,
      enrolled: acc.enrolled + s.enrolled,
      disqualified: acc.disqualified + s.disqualified,
    }),
    { source: 'TOTAL', pool: 0, engaged: 0, gatePassed: 0, applied: 0, enrolled: 0, disqualified: 0 },
  )
  return { sources, totals }
}
