# Lead-Intelligence Experiment — Build Tracker

**Goal:** instrument Sturec so the BSB-pool experiment is fully measurable: signals → intent score → 6Q gate → work queue → outcomes → funnel by source. No partner portal, no tenancy, no cost comparison yet (costs = QBR).

**STATUS: ALL BUILT + DEPLOYED + E2E-VERIFIED 2026-06-12.** Gate fields backfilled pool-wide (1,983 programmes · 1,480 dq-tagged); initial lifecycle batch: 1,040→nurturing, 52 qualified, 39 hard-DQ'd. RBAC: counsellors see assigned only; funnel admin-only.

**Decisions locked (2026-06-11):**
- Mautic ingestion via **webhook** (receiver already exists in `modules/webhooks` → BullMQ → `webhooks.worker.ts`), weekly SQL reconciliation as backstop.
- `lead_sources.cost_eur` stays **nullable/unfilled** until QBR.
- MSc Sustainable Strategy → `active=false` (may return, no clarity). 44 tagged leads = "re-route", not disqualified.
- Gate = **binary disqualifiers** (programme offered / intake / self-fund / France real / English / live contact) — NOT graded profile scoring (validated: profile fit doesn't separate winners from losers).

## Status board

| # | Task | Status | Notes |
|---|---|---|---|
| 17 | Prisma migration | ✅ done | live on prod; BSB catalog seeded (9 active, Sustainable inactive) |
| 18 | Mautic webhook handler → lead_events | ✅ done | E2E verified in prod 2026-06-12 |
| 19 | Intent recompute job | ✅ done | per-lead on event + nightly refresh 03:00 UTC |
| 20 | Brevo webhook + native emitters | ✅ done | Brevo webhook id 2034266; booking/WA/chat emit; doc deferred (student-stage) |
| 21 | Intelligence module API | ✅ done | /intelligence/* (work-queue, gate, outcome, events, timeline, funnel) |
| 22 | Work Queue page + gate form + outcome | ✅ done | /work-queue in sidebar |
| 23 | Funnel dashboard | ✅ done | /funnel; € dormant until QBR |
| 24 | AI chat gate extraction | ✅ done | assessment prompt + saveAssessment apply |
| 25 | Backfill | ✅ done | 122 outcomes, 5,576 source-linked, 3,277 events, 1,676 intents |
| 26 | Mautic + Brevo webhooks configured | ✅ done | Mautic hook id 2; secrets on @sturec/api |
| 27 | Weekly funnel snapshot job | ✅ done | Mondays 06:00 UTC |
| 28 | Import auto-scoring + gate pre-fill + source link | ✅ done | deterministic, runs in imports worker |
| 29 | Lifecycle rules (auto status transitions) | ✅ done | hard-tag DQ · gate-clean+intent≥15 → qualified · engaged → nurturing; per-lead on recompute + nightly |

## Experiment metrics (what the dashboard must answer)

- Leads → engaged (any event) → gate-passed → applied → enrolled, **per source**
- Intent distribution + how it shifts after each campaign
- Disqualifier mix (why leads die) — feeds QBR + next event targeting
- Counsellor contacts per outcome (productivity proxy)
- Hero line (computed at cycle end): *4 people → 5,500 leads → X qualified apps → Y enrolments*

## Run rules (team SOP)

1. Work only from the Work Queue, top-down.
2. Every contact logged; outcome mandatory on close (one tap).
3. WhatsApp replies logged via the "log WA reply" action until WA API lands.
4. 2027+ leads → nurture, never the daily queue.

*Updated as tasks complete. Related: `docs/next-work-lead-intelligence.md` (full plan), `docs/lead-qualification-gate.md` (6Q spec).*
