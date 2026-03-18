# STUREC — Student Recruitment Operating System

France-focused student recruitment platform. AI-powered lead qualification, counsellor-managed pipeline, 13-stage student lifecycle from lead to alumni.

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS, React Query
- **Backend**: Fastify, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Queue**: BullMQ + Redis
- **AI**: Groq API (llama-3.3-70b-versatile), direct calls, no LangGraph
- **Auth**: Firebase Auth (identity) + PostgreSQL (roles/permissions)
- **Storage**: Google Cloud Storage (documents), signed URLs
- **CRM**: Mautic (downstream only, never source of truth)
- **Scheduling**: Cal.com
- **WhatsApp**: WhatsApp API or Sensy.ai
- **Monorepo**: Turborepo
- **Deploy**: Railway (4 services: web, api, worker, db + Redis add-on)

## Architecture Reference

Read these BEFORE implementing any module. They contain the agreed design decisions, data model, API contracts, and constraints.

- [System Overview](docs/architecture/01-system-overview.md) — three deployables, data flow, key rules
- [Repo Structure](docs/architecture/02-repo-structure.md) — folder layout, module pattern, deployment map
- [Data Model](docs/architecture/03-data-model.md) — full PostgreSQL schema, every table, every field
- [API Contracts](docs/architecture/04-api-contracts.md) — all endpoints, auth rules, request/response shapes
- [AI Chat Design](docs/architecture/05-ai-chat-design.md) — prompt architecture, context management, scoring
- [Queues & Workers](docs/architecture/06-queues-and-workers.md) — job definitions, triggers, idempotency
- [Frontend Map](docs/architecture/07-frontend-map.md) — routes, layouts, page priority, role access

## Project Structure

```
sturec/
├── apps/
│   ├── web/          # Next.js frontend (public + student + internal)
│   └── api/          # Fastify backend (API + worker mode)
├── packages/
│   ├── shared/       # Types, constants, Zod validation schemas
│   └── config/       # Shared tsconfig, eslint, prettier
├── docs/architecture/ # Design docs (read before building)
└── CLAUDE.md          # You are here
```

## Code Patterns

### Backend module structure
Every module in `apps/api/src/modules/` follows:
```
modules/<name>/
├── routes.ts        # Fastify route definitions
├── controller.ts    # Request handling
├── service.ts       # Business logic
├── repository.ts    # Prisma queries (ONLY place that imports prisma)
├── schema.ts        # Zod request/response schemas
└── types.ts         # Module-specific types
```

### Integrations are separate from modules
`apps/api/src/integrations/` holds vendor adapters (groq, mautic, firebase, gcs, calcom, whatsapp, email). Modules call integrations, never the reverse. Swapping vendors should only require changing the integration, not the module.

### Shared types
All types shared between frontend and backend live in `packages/shared/src/types/`. Zod schemas in `packages/shared/src/validation/`. Import from `@sturec/shared`.

## Hard Rules

1. **ASK before building if anything is unclear.** Do not guess. Do not invent requirements. If a design doc is ambiguous or missing detail, ask me before writing code.

2. **Backend is source of truth.** Not Mautic. Not the frontend. Not Firebase. All business data lives in PostgreSQL via the backend API.

3. **Student-AI chat is PRIVATE.** Never expose chat_messages to counsellors or admins. They see ai_assessments only (structured scores + one-line summary). See [AI Chat Design](docs/architecture/05-ai-chat-design.md).

4. **AI is an advisor, not a sales bot.** No aggressive CTAs, no urgency tactics, no pushing bookings. The AI collects profile data through natural conversation. Cold-lead chat is auth-first: users sign in before chatting so every session has a known identity. See [AI Chat Design](docs/architecture/05-ai-chat-design.md).

5. **Explicit commands for critical state changes.** Stage changes, assignments, document verify/reject, lead conversion — use dedicated endpoints, not generic PATCH. See [API Contracts](docs/architecture/04-api-contracts.md).

6. **Check the architecture docs before implementing a module.** The data model, API contracts, and design decisions are already specified. Read the relevant doc first. Fill gaps by asking me, not by inventing.

7. **No Prisma imports outside repository files.** All database access goes through `repository.ts` in each module. Services call repositories, controllers call services.

8. **All mutations emit BullMQ jobs for side effects.** Mautic sync, notifications, AI scoring — these happen async via workers, not in the request path.

9. **Idempotent workers.** Every job must be retry-safe. Check if already processed before executing. See [Queues & Workers](docs/architecture/06-queues-and-workers.md).

10. **Soft delete on core tables.** Users, students, leads, documents use `deleted_at`. Never hard delete business records.

## What NOT to Do

- Do not add Mautic as source of truth for any data
- Do not use LangGraph or LangChain for the AI chat
- Do not expose chat transcripts to internal team
- Do not put business logic in Next.js server actions — it belongs in the Fastify API
- Do not import Prisma directly in services or controllers
- Do not create new tables without checking [Data Model](docs/architecture/03-data-model.md) first
- Do not create new endpoints without checking [API Contracts](docs/architecture/04-api-contracts.md) first
- Do not guess at permission rules — check the RBAC table in the API contracts doc
- Do not skip Zod validation on any endpoint
- Do not make sync HTTP calls to Mautic/WhatsApp/Cal.com in the request path — use workers

## Build Order

1. Monorepo scaffolding (turbo, packages, docker-compose)
2. Backend: Prisma schema + migrations
3. Backend: auth module (Firebase verify + user/role lookup)
4. Backend: catalog module (CRUD for all 5 knowledge bases)
5. Backend: leads module (create, list, import, convert, assign)
6. Backend: students module (CRUD, stages, timeline, assignments)
7. Backend: documents module (upload flow, checklist, verify/reject)
8. Backend: chat + AI module (Groq integration, sessions, assessments)
9. Backend: queues + workers (mautic sync, notifications, lead routing)
10. Frontend: auth + internal layout
11. Frontend: catalog admin pages
12. Frontend: leads list + detail
13. Frontend: students list + detail (tabbed view)
14. Frontend: public homepage + programs
15. Frontend: auth-gated advisor entry + student AI chat
16. Frontend: student portal + progress analytics
17. Integrations: Mautic webhook sync
18. Integrations: Cal.com booking
19. Integrations: WhatsApp
20. Frontend: internal analytics dashboard (pipeline, overview, counsellors, students)
