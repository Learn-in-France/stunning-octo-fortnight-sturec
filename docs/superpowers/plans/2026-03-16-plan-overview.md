# STUREC Implementation Plan Overview

7 sequential plans. Each ends in working, testable software on the default branch.

## Execution Model

- Do not start a plan until its blocking schema/contracts are stable.
- Prefer vertical slices: schema + API + worker + UI for that subsystem where possible.
- Definition of done for every plan: code merged, tests passing, docs updated, env vars documented, seed/demo path available.

## Plans

| # | Name | Scope | Depends On |
|---|------|-------|------------|
| 1 | Foundation | Turborepo scaffold, Prisma baseline, Docker Compose, Firebase auth, user provisioning, middleware, validation | none |
| 2 | Core Backend | Catalog, leads, students, applications, documents, activity logging, assignments, notes, contacts, consent, lead conversion | Plan 1 |
| 3 | AI & Async Backend | Chat sessions, Groq integration, AI assessments, batch assessment, gap analysis, BullMQ queues/workers, idempotency | Plans 1-2 |
| 4 | Internal Frontend | Internal app shell, auth guards, dashboard, catalog CRUD UI, leads, students, applications, assignments, AI snapshot, activity log | Plans 1-3 |
| 5 | Public & Student Frontend | Marketing pages, programs discovery, auth-gated advisor entry, student portal, student AI chat, documents, checklist, progress analytics | Plans 1-4 |
| 6 | External Integrations | Mautic, Cal.com, WhatsApp/Sensy, webhooks, sync logs, campaign triggers, booking sync | Plans 1-5 |
| 7 | Analytics | Pipeline, counsellor, student analytics, dashboards, student-facing progress, KPI definitions | Plans 2-6 |

## Cross-Cutting Requirements

- **Testing**: unit tests for services, integration tests for API modules, worker tests for idempotency, smoke tests for key UI flows
- **Seed/demo data**: one cold-lead journey, one imported university lead, one converted student, one document workflow
- **Observability**: structured logs, queue failure visibility, webhook audit logs, env var checklist
- **Security**: Firebase verification, route RBAC, signed URLs, webhook secret verification, transcript privacy guarantees

## Acceptance Order

Plan 1 → Plan 2 → Plan 3 → Plan 4 → Plan 5 → Plan 6 → Plan 7
