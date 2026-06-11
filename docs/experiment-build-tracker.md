# Lead-Intelligence Experiment — Build Tracker

**Goal:** instrument Sturec so the BSB-pool experiment is fully measurable: signals → intent score → 6Q gate → work queue → outcomes → funnel by source. No partner portal, no tenancy, no cost comparison yet (costs = QBR).

**Decisions locked (2026-06-11):**
- Mautic ingestion via **webhook** (receiver already exists in `modules/webhooks` → BullMQ → `webhooks.worker.ts`), weekly SQL reconciliation as backstop.
- `lead_sources.cost_eur` stays **nullable/unfilled** until QBR.
- MSc Sustainable Strategy → `active=false` (may return, no clarity). 44 tagged leads = "re-route", not disqualified.
- Gate = **binary disqualifiers** (programme offered / intake / self-fund / France real / English / live contact) — NOT graded profile scoring (validated: profile fit doesn't separate winners from losers).

## Status board

| # | Task | Status | Notes |
|---|---|---|---|
| 17 | Prisma migration: lead_events, lead_sources, gate/outcome/intent columns, Program.active | 🔨 in progress | |
| 18 | Mautic webhook handler → lead_events | ⬜ | email_on_open + page_on_hit |
| 19 | Intent recompute job | ⬜ | booking 25 · doc 20 · WA 15 · webinar 12 · diag-click 8 · open 1, ~30d decay |
| 20 | Brevo webhook + native emitters (booking/chat/doc) | ⬜ | |
| 21 | Intelligence module API (work-queue / gate / outcome / funnel) | ⬜ | |
| 22 | Work Queue page + gate form + outcome buttons | ⬜ | the morning screen |
| 23 | Funnel dashboard | ⬜ | source × stage; € column dormant until QBR |
| 24 | AI chat asks 6 gate questions → structured fields | ⬜ | |
| 25 | Backfill 234 outcomes + lead_sources from source_partner | ⬜ | baseline for the case study |
| 26 | Configure Mautic webhook (ops) | ⬜ | needs Mautic UI + prod endpoint |
| 27 | Weekly funnel snapshot job | ⬜ | before/after charting |

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
