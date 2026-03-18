# STUREC System Design Spec

**Date:** 2026-03-16
**Status:** Approved by user through iterative design review

## Summary

STUREC is a France-focused student recruitment operating system. It captures and qualifies leads via an AI chat that acts as a genuine academic advisor, manages students through a 13-stage lifecycle (lead to alumni), coordinates counsellors and ops staff, and syncs downstream to Mautic CRM for email campaigns and nurture sequences.

## Architecture

Three separately deployed services on Railway:

1. **Next.js 15 frontend** — public marketing site, student portal, internal counsellor/admin workspace. Single app with route groups: `(public)`, `(student)`, `(internal)`.
2. **Fastify backend API** — TypeScript, Prisma ORM, PostgreSQL. Source of truth for ALL data. Handles auth, leads, students, AI chat orchestration, documents, scheduling, analytics.
3. **Fastify worker** — same codebase as API, runs BullMQ job processors for async side effects (Mautic sync, notifications, AI scoring, document processing).

Supporting services: PostgreSQL (Railway managed), Redis (Railway add-on), Google Cloud Storage (documents), Groq API (AI), Firebase Auth (identity), Cal.com (booking), WhatsApp API/Sensy.ai (messaging).

Mautic is downstream only — backend pushes to it, never reads from it as source of truth.

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Backend is source of truth, not Mautic | Mautic is for campaigns/nurture only. Student state, scores, stages live in PostgreSQL. |
| Direct Groq API, not LangGraph | LangGraph makes conversation feel mechanical. Direct calls with smart prompts feel natural. |
| Chat transcripts private to students | Counsellors see structured AI assessment summaries only. Builds student trust. |
| Leads table separate from students | Many contacts never qualify. Keeps student table clean and semantically correct. |
| Explicit command endpoints for critical ops | Stage changes, assignments, document verify/reject use dedicated endpoints, not generic PATCH. |
| All mutations emit async jobs | Request path stays fast. Side effects (sync, notifications, scoring) happen via BullMQ workers. |
| Admin-managed catalog in database | Universities, programs, visa rules, eligibility, Campus France prep — editable without redeployment. |
| Firebase for identity, PG for roles | Firebase handles auth. App-level permissions live in PostgreSQL users table. |
| Cold-lead chat is auth-first | Every chat starts with a known Firebase user, eliminating anonymous-session reconciliation and deferred account linking. |
| Feature-based frontend organization | Frontend features mirror backend modules for clean mapping. |
| Monorepo with shared types | TypeScript types and Zod schemas shared between frontend and backend via packages/shared. |
| Counsellor analytics combines system events + manual logs | Track real work without forcing counsellors to duplicate platform-visible actions. |
| AI for university leads (batch assessment + gap analysis) | Imported leads get instant readiness scores and action plans without needing a chat session. Counsellors see AI snapshot from day one. |
| Lead scoring is explainable and internal-only | AI provides per-dimension qualification signals; backend computes final qualification score and `P1/P2/P3` priority. Students never see these internal labels. |

## Scope

### In scope (MVP)
- Monorepo scaffolding (Turborepo, Docker Compose)
- Full PostgreSQL schema (all tables defined in data model doc)
- All backend API modules (auth, access, leads, students, applications, chat, AI, catalog, documents, scheduling, notifications, analytics, mautic)
- Queue and worker infrastructure
- Counsellor activity logging for offline calls/follow-ups
- Internal workspace (leads list/detail, students list/detail, catalog CRUD, team management)
- Internal analytics workspace (pipeline, overview, counsellors, students)
- Public site (homepage, programs, apply form, auth)
- Auth-gated advisor entry on public site + student AI chat
- Internal lead qualification scoring and `P1/P2/P3` priority queue for admin assignment
- AI batch assessment + gap analysis for university lead imports
- Student portal (dashboard, profile, documents, checklist, applications)
- Student-facing progress analytics page
- Mautic integration (contact sync, campaign triggers)
- Cal.com booking integration
- WhatsApp integration
- Operational analytics dashboards

### Phase 2 (Post-MVP)
- Smart counsellor routing (AI-scored complexity matching instead of round-robin)
- Personalized outreach draft generation for counsellors
- Profile completion chat for university leads (shorter focused flow)
- Campus France prep generation (personalized interview materials)

### Out of scope (Future)
- Campus France interview simulator
- SOP draft generator
- Visa risk analyzer (beyond basic scoring)
- Document OCR / automated verification
- Multi-country expansion beyond France
- Mobile app

## Reference Documents

All detailed specifications live in `docs/architecture/`:

- [01-system-overview.md](../architecture/01-system-overview.md) — deployables, data flow, architectural rules
- [02-repo-structure.md](../architecture/02-repo-structure.md) — folder layout, module patterns, Railway deployment
- [03-data-model.md](../architecture/03-data-model.md) — complete PostgreSQL schema
- [04-api-contracts.md](../architecture/04-api-contracts.md) — all endpoints, auth, request/response shapes
- [05-ai-chat-design.md](../architecture/05-ai-chat-design.md) — prompt architecture, scoring, context management
- [06-queues-and-workers.md](../architecture/06-queues-and-workers.md) — job definitions, triggers, idempotency
- [07-frontend-map.md](../architecture/07-frontend-map.md) — routes, layouts, page priority, role access

## Build Order

1. Monorepo scaffolding
2. Prisma schema + migrations
3. Auth module
4. Catalog module (5 knowledge bases)
5. Leads module
6. Students module
7. Documents module
8. Chat + AI module
9. Queues + workers
10. Frontend: auth + internal layout + catalog admin
11. Frontend: leads + students views
12. Frontend: public site + auth-gated advisor entry
13. Frontend: student portal + student AI chat + progress analytics
14. Integrations: Mautic, Cal.com, WhatsApp
15. Frontend: internal analytics dashboard (pipeline, overview, counsellors, students)

## Approval History

- **Repo structure**: Approved with 10 improvements (integrations separation, queues layer, module internals pattern, catalog rename, AI module split, storage abstraction, access module, packages/config)
- **Data model**: Approved with 20 improvements (leads table, applications table, student_document_requirements, student_assignments, consent_events, student_contacts, ai_assessments, program_intakes, reference_code, reason_codes, document versioning, enriched notifications, soft delete strategy, catalog audit fields)
- **API contracts**: Approved with 12 improvements (auth/team separation, lead timeline, conversion idempotency, stage command typing, assignment endpoints, two-step document upload, explicit verify/reject, student-nested AI routes, chat session listing, notification scoping, Mautic route nesting, standardized pagination/filtering)
- **AI chat architecture**: Approved as designed (direct Groq, smart prompts, backend decision layer)
- **Frontend map**: Approved as designed (three surfaces, feature folders, MVP phases, role access)
- **Queue architecture**: Approved as designed (7 queues including durable webhooks ingestion, idempotency and `/ops/*` APIs shipped; custom visual queue UI is live at `/automations`, while Bull Board remains optional)
- **CLAUDE.md**: Created with hard rules, build order, and architecture doc links
