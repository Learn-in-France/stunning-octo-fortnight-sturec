# Repository Structure

Turborepo monorepo with three packages.

```
sturec/
├── apps/
│   ├── web/                          # Next.js 15 frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (public)/         # Marketing, programs, visa info, AI chat, apply
│   │   │   │   ├── (student)/        # Authenticated student portal
│   │   │   │   └── (internal)/       # Counsellor + admin workspace
│   │   │   ├── components/
│   │   │   │   ├── ui/               # Buttons, inputs, modal, table, badges
│   │   │   │   ├── layout/           # Navbar, sidebar, page shell
│   │   │   │   └── shared/           # Empty states, loaders, filters
│   │   │   ├── features/             # Feature modules mirroring backend
│   │   │   │   ├── auth/
│   │   │   │   ├── public-home/
│   │   │   │   ├── lead-capture/
│   │   │   │   ├── public-chat/
│   │   │   │   ├── students/
│   │   │   │   ├── leads/
│   │   │   │   ├── applications/
│   │   │   │   ├── documents/
│   │   │   │   ├── ai-assessments/
│   │   │   │   ├── bookings/
│   │   │   │   ├── notifications/
│   │   │   │   ├── analytics/
│   │   │   │   ├── catalog/
│   │   │   │   ├── team/
│   │   │   │   └── timeline/
│   │   │   ├── lib/
│   │   │   │   ├── api/              # API client
│   │   │   │   ├── auth/             # Firebase auth helpers
│   │   │   │   ├── guards/           # Route guards
│   │   │   │   ├── utils/
│   │   │   │   └── config/
│   │   │   ├── hooks/
│   │   │   └── providers/
│   │   └── package.json
│   │
│   └── api/                          # Fastify backend + worker
│       ├── src/
│       │   ├── modules/              # Business domain modules
│       │   │   ├── auth/             # Firebase token verify + session
│       │   │   ├── access/           # Role management, permissions
│       │   │   ├── students/         # Student CRUD, lifecycle, stages
│       │   │   ├── leads/            # Pre-student funnel
│       │   │   ├── applications/     # Student ↔ program admissions tracking
│       │   │   ├── chat/             # AI chat sessions, messages
│       │   │   ├── ai/               # Assessment scoring, prompts, extraction
│       │   │   ├── catalog/          # Universities, programs, visa rules, eligibility, Campus France prep
│       │   │   ├── documents/        # Upload metadata, checklist, verification
│       │   │   ├── notifications/    # Notification orchestration
│       │   │   ├── scheduling/       # Booking management
│       │   │   ├── mautic/           # Sync orchestration, campaign triggers, sync-log reads
│       │   │   └── analytics/        # KPI queries, counsellor performance, student progression
│       │   ├── integrations/         # External vendor adapters
│       │   │   ├── firebase/         # Auth verification
│       │   │   ├── groq/             # LLM API client
│       │   │   ├── mautic/           # Mautic REST API client
│       │   │   ├── whatsapp/         # WhatsApp API / Sensy.ai
│       │   │   ├── calcom/           # Cal.com API client
│       │   │   ├── storage/          # Google Cloud Storage
│       │   │   └── email/            # Email sender (SES or similar)
│       │   ├── queues/               # Queue definitions, connection, retry policies
│       │   ├── workers/              # BullMQ job processors
│       │   ├── middleware/           # Auth, RBAC, validation, error handling
│       │   ├── lib/                  # Shared utilities
│       │   ├── server.ts             # Fastify entry point (API mode)
│       │   └── worker.ts             # BullMQ entry point (worker mode)
│       ├── prisma/
│       │   └── schema.prisma
│       └── package.json
│
├── packages/
│   ├── shared/                       # Shared TypeScript types + validation
│   │   ├── src/
│   │   │   ├── types/                # Student, Lead, Program, Stage types
│   │   │   ├── constants/            # Stage definitions, score thresholds, enums
│   │   │   └── validation/           # Zod schemas (shared API + frontend)
│   │   └── package.json
│   └── config/                       # Shared tsconfig, eslint, prettier
│       └── package.json
│
├── turbo.json
├── package.json
├── docker-compose.yml                # Local dev: Postgres + Redis
└── CLAUDE.md
```

## Module Internal Pattern

Every backend module follows this structure:

```
modules/students/
├── routes.ts           # Fastify route definitions
├── controller.ts       # Request handling, validation
├── service.ts          # Business logic
├── repository.ts       # Prisma queries (DB access isolated here)
├── schema.ts           # Zod request/response schemas
└── types.ts            # Module-specific types
```

## Railway Deployment

| Service | Source | Start Command |
|---------|--------|---------------|
| `sturec-web` | `apps/web` | `next start` |
| `sturec-api` | `apps/api` | `node dist/server.js` |
| `sturec-worker` | `apps/api` | `node dist/worker.js` |
| `sturec-db` | Railway managed PostgreSQL | — |
| Redis | Railway add-on | — |

## Local Development

```bash
docker-compose up -d          # Postgres + Redis
turbo dev --filter=api        # Backend on :3001
turbo dev --filter=web        # Frontend on :3000
```
