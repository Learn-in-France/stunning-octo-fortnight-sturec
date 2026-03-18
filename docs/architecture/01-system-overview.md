# System Overview

## What This Is

STUREC (Student Recruitment Operating System) is a France-focused student recruitment platform. It helps an education agency capture leads, qualify students via AI chat, manage applications through visa and arrival, and coordinate counsellors and operations staff.

## Three Deployables

```
[Next.js Frontend] --> [Fastify Backend API] --> [Mautic CRM]
       |                      |                      ^
       |                [PostgreSQL]                  |
       |                [Redis/BullMQ]                |
       |                [Google Cloud Storage]        |
       |                [Groq AI]                     |
       +---------- [Fastify Worker] -----------------+
```

1. **Frontend** (`apps/web`) — Next.js 15. Serves three surfaces: public marketing site, student portal, internal counsellor/admin workspace.
2. **Backend API** (`apps/api`) — Fastify + Prisma + PostgreSQL. Source of truth for ALL data. Handles auth, leads, students, AI chat, documents, scheduling, analytics.
3. **Worker** (`apps/api` in worker mode) — Same codebase, runs BullMQ processors. Handles Mautic sync, AI scoring, notifications, document processing.

**Mautic** is downstream only. Backend pushes data to Mautic for email campaigns and nurture sequences. Mautic never creates records — it receives them.

## Data Flow

### Cold leads (marketing)
1. Student visits website → sees chat CTA and signs in with Firebase (Google or email+password)
2. Backend creates or verifies `users` record on first sign-in
3. Student starts AI chat with known identity from message one
4. Backend creates lead automatically on first chat session or authenticated form submission
5. AI chat collects profile naturally (NOT like a form)
6. Backend saves AI assessment with per-dimension qualification signals (academic, financial, language, motivation, urgency, document readiness, visa complexity, completeness)
7. Backend computes internal `qualification_score` and `priority_level` from those signals using explicit rules and cutoffs
8. Lead routing worker places the lead into the correct admin assignment queue: `P1` immediate review, `P2` follow-up soon, `P3` nurture/manual review
9. Admin assigns counsellor based on priority queue and workload
10. Counsellor works lead → converts to student when qualified

### University leads (pre-qualified)
1. Admin bulk imports CSV via backend endpoint
2. Backend creates lead records with source=university, status=new (leads have status, not lifecycle stages — the 13-stage lifecycle begins only after conversion to a student record)
3. Import worker chains AI batch assessment: scores each lead's profile from imported data (GPA, field, target programs), computes internal qualification/priority, and generates gap analysis (missing documents, missing profile fields, suggested next actions)
4. Admin assigns counsellor from the same `P1` / `P2` / `P3` priority queue — counsellor sees AI readiness snapshot, qualification breakdown, and action plan from day one
5. Backend triggers Mautic campaigns as needed (Campus France prep, visa readiness, etc.)

### Student lifecycle (13 stages)
```
Lead created → Intake completed → Qualified/routed →
Counsellor consultation → Application started → Offer/admission confirmed →
Campus France readiness → Visa file readiness → Visa submitted → Visa decision →
Accommodation/arrival onboarding → Arrived in France → Alumni/referral
```
Source is captured as a field on the student record (`source`, `source_partner`), not as a lifecycle stage.
Every stage has: owner, exit condition, timestamp, automation rule. Stage transitions are immutable audit records.

### Analytics and performance tracking
- Admin analytics covers pipeline health, counsellor activity/performance, and student progression.
- Lead analytics also covers qualification distribution, priority queue health, and admin/counsellor response to `P1` / `P2` / `P3` leads.
- Counsellor performance is measured from a mix of automatic system events (assignments, stage transitions, bookings, document reviews, applications) and explicit counsellor activity logs for offline work such as calls and follow-ups.
- Student analytics focuses on progress through stages, time-in-stage, document completion, applications, and visa readiness milestones.

## Key Architectural Rules

- Backend is the single source of truth. Not Mautic. Not the frontend.
- Student-AI chat conversations are PRIVATE. Counsellors see only structured AI assessment summaries (scores, recommended next step, one-line summary). Never the transcript.
- Lead qualification and priority are INTERNAL ONLY. Students never see raw qualification scores, priority levels, visa-complexity labels, or internal disposition recommendations.
- AI acts as a genuine academic advisor, not a sales bot or lead qualification funnel.
- Cold-lead chat is auth-first. No anonymous chat sessions. Every chat session starts with a known Firebase identity.
- All critical state changes (stage, assignment, document verification) use explicit command endpoints, not generic PATCH.
- All mutations that affect student state emit BullMQ jobs for async side effects.
- Firebase handles authentication (identity proof). PostgreSQL handles authorization (roles, permissions).
- AI can suggest per-dimension qualification signals, but the backend computes the final `qualification_score`, `priority_level`, and routing outcome using explicit deterministic rules.
- Analytics should prefer deriving metrics from core system events, with manual counsellor input used only for actions the platform cannot observe directly.
