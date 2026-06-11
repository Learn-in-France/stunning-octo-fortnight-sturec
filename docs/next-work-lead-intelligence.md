# Next Work — Lead Intelligence Pipeline (Sturec)

**Owner:** founder + Lane 1 (api/prisma/shared)
**Status:** scoped, ready to build
**Created:** 2026-06-09

This is the engineering plan to productionize the two-stage lead model we validated against LIF's own labelled outcomes. It supersedes ad-hoc scoring scripts in `scripts/icp/`.

---

## 0. What we validated (the basis for this work)

On 234 hand-labelled leads, joining Sturec + Mautic + Brevo (see `scripts/icp/pipeline.py`, `data/labeled_merged.csv`):

- **Email open-depth is a real intent signal** — monotonic across outcomes (COLD 35% open → WON 92%; avg opens 1.0 → 3.7).
- It is a **high-recall filter, not a precise ranker** (best single-signal precision ~32% @ 82% recall). Use it to remove dead weight, not to pick winners.
- **Email clicks (current) are not predictive** (26%, below base rate) — they need *diagnostic* links.
- **ICP / demographic fit does NOT separate outcomes** (flat 86–94; losers score higher). ICP is for targeting, never individual scoring.
- **Precision comes from stacking:** intent filter + disqualifier gate + timing. The disqualifier gate hit ~100% precision where codable.

**Resulting model:**
> Stage 1 **Intent** (email/behavioral, high-recall) → Stage 2 **Disqualifier gate** (6 Qs, precision) → **Human** converts. **ICP = targeting only.** Every outcome feeds back to retrain.

---

## Workstream A — Intent data pipeline (highest priority)

**Problem:** engagement is trapped in Mautic & Brevo; Sturec sees none of it (`bookings/chats/activities` were 0 for worked leads). Without it, intent can't be scored in-product.

### A1. `lead_events` table
New table (per [Data Model](architecture/03-data-model.md) conventions; add migration):
```
lead_events
  id, lead_id (FK), event_type, source, weight, occurred_at, metadata jsonb, created_at
  index (lead_id), (event_type), (occurred_at)
```
`event_type` ∈ `email_open | email_click | email_send | whatsapp_reply | booking_made | webinar_attended | doc_uploaded | chat_message | call_logged`.
`source` ∈ `mautic | brevo | calcom | whatsapp | sturec`.

### A2. Ingestion workers (BullMQ, idempotent — per Hard Rule #8/#9)
- **Mautic poller** — pull `email_stats` (opens: `is_read`, `open_count`, `last_opened`) and `page_hits` (clicks) by `email_address` → upsert `lead_events`. Dedup on (lead_id, event_type, occurred_at). Creds: Mautic MySQL (memory `reference_mautic_db`).
- **Brevo poller/webhook** — `/v3/contacts/{email}` statistics, or Brevo webhook for `opened/clicked`. (Only ~25% of leads are in Brevo — Mautic is primary.)
- **Native events** — booking (Cal.com webhook), chat_message, doc_upload already in Sturec → emit `lead_events` on write.

**DoD:** a worked lead's opens/clicks/booking appear as `lead_events` rows within the poll interval; re-running the poller creates no duplicates.

### A3. Intent score (computed, stored on lead)
Add `lead.intent_score Int?` + `lead.intent_updated_at`. A worker recomputes on new events:
```
intent = weighted recency-decayed sum of lead_events
  weights (from validation): booking_made 30 · doc_uploaded 25 · whatsapp_reply 15 ·
  webinar_attended 12 · email_click(diagnostic) 8 · email_open +depth(cap) · email_open 1
  recency decay so stale opens fade
```
**Definition note:** opens drive recall; commitment actions (booking/doc/reply) drive the high end. NOT clicks-as-is until A-D ships.
**DoD:** intent_score backfilled for all 5,580; tier gradient reproduces COLD→WON ordering.

---

## Workstream B — Disqualifier gate (the precision stage)

**Problem:** the real disqualifiers (off-portfolio, 2027+, scholarship-only, France-weak, English, dead-contact) live in notes, not fields — so nothing can gate on them. Capture them as structured data. Spec in [`lead-qualification-gate.md`](lead-qualification-gate.md).

### B1. Disqualifier fields on lead / assessment
Add structured fields (lead or ai_assessment):
`programme_requested`, `programme_in_portfolio bool`, `intake_year`, `funding_self_possible bool`, `france_is_real bool`, `english_ready bool`, `contact_valid bool`, plus `dq_tags text[]`.

### B2. 6-question flow in the AI chat / WhatsApp intro
The AI chat (Groq, per [AI Chat Design](architecture/05-ai-chat-design.md)) asks the 6 questions naturally on first touch, writes the fields, sets `dq_tags`. Respect Hard Rule #3 (chat private) — only the structured fields/flags surface to counsellors, not the transcript.

**DoD:** a new lead chatting in produces the 6 fields + dq_tags; off-portfolio/2027/scholarship-only auto-tagged.

### B3. Programme portfolio reference
Maintain the canonical list of **currently-offered** BSB programmes (resolve the MSc Sustainable Strategy ambiguity — flagged "not sure"). Drives `programme_in_portfolio` + redirect suggestions.

---

## Workstream C — Diagnostic-link emails (upgrade the click signal)

Per the Intent-Identification Email scope in [`lif-intent-pipeline-pitch.md`](lif-intent-pipeline-pitch.md). 5-email sequence where each link is diagnostic (scholarship/apply = high intent; programme links self-capture interest). Clicks then become predictive (today they aren't). Tag clicks by link category into `lead_events.metadata`.

**DoD:** clicking the scholarship/apply link raises intent meaningfully and tags the programme.

---

## Workstream D — The funnel output + counsellor view

- **Two-stage list:** `intent high (Stage 1) AND no disqualifier (Stage 2)` → the active-work queue, ranked by intent. Exclude `intake_year >= 2027` to a separate nurture list.
- **Counsellor UI:** show intent_score, dq_tags, programme — NOT the chat transcript.
- Replaces the static `scripts/icp/BSB-Leads-Scored.csv` with a live in-product view.

**DoD:** counsellor opens Sturec and sees a ranked, gated call list that updates as engagement/qualification change.

---

## Workstream E — Feedback loop (the moat)

- Log every disposition (Application Done / Disqualified + reason) as a structured outcome on the lead.
- Once ~300–500 own outcomes accumulate, replace the heuristic intent weights with a **model trained on LIF conversions** (can finally predict, not just filter). Re-run the `pipeline.py` methodology on live data quarterly.

**DoD:** outcomes are queryable; a scheduled job reports tier-gradient + precision/recall monthly.

---

## Sequencing & dependencies

```
A1 → A2 → A3   (intent pipeline — do first; unblocks everything)
B1 → B2        (gate — parallel to A; B3 needed for B1)
C              (after A2; sharpens clicks)
D              (after A3 + B2 — needs both scores)
E              (after D; needs accumulated outcomes)
```

**Build order:** A (intent pipeline) → B (gate) → D (funnel) → C (diagnostic emails) → E (trained model).

## Open decisions (need founder input)
1. **MSc Sustainable Strategy** — currently offered? (blocks B3 portfolio list)
2. Mautic ingestion: **poll vs webhook** (poll is simpler, webhook is realtime).
3. Brevo: keep as a source given only ~25% coverage, or rely on Mautic + native events only?
4. Where the 6 fields live — on `lead` vs `ai_assessment` (affects RBAC exposure).

## Won't do (validated dead ends)
- ❌ Demographic/ICP fit score as an individual qualifier — proven not to separate outcomes (n=234).
- ❌ Raw email clicks as intent — not predictive until diagnostic links (C) ship.

## Reference artifacts
`scripts/icp/pipeline.py` · `data/labeled_merged.csv` (labelled training set) · `docs/lead-qualification-gate.md` · `docs/lif-intent-pipeline-pitch.md` · `docs/bsb-india-fit-rubric.md` (ICP, marketing use) · memory `project_lead_scoring_findings`, `reference_linkedin_data_apis`.
