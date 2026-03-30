# STUREC - Student Recruitment Operating System :

AI-powered student recruitment platform for international students pursuing higher education in France. Manages the full 13-stage lifecycle from lead capture to alumni, with AI-driven qualification, counsellor-managed pipeline, and student self-service portal.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TailwindCSS, React Query |
| Backend | Fastify, Prisma ORM, PostgreSQL |
| Queue | BullMQ + Redis |
| AI | Groq API (llama-3.3-70b-versatile) |
| Auth | Firebase Auth (identity) + PostgreSQL (roles/permissions) |
| Storage | Google Cloud Storage (signed URLs) |
| CRM | Mautic (downstream sync only) |
| Scheduling | Cal.com |
| Messaging | WhatsApp API / Sensy |
| Monorepo | Turborepo + npm workspaces |
| Deploy | Railway (web, api, worker, db + Redis) |

## Project Structure

```
sturec/
├── apps/
│   ├── api/              # Fastify backend (API + worker mode)
│   │   ├── prisma/       # Schema, migrations, seed
│   │   ├── src/
│   │   │   ├── integrations/   # Vendor adapters (firebase, groq, mautic, gcs)
│   │   │   ├── lib/            # Shared utilities (queue, pagination, mappers)
│   │   │   ├── middleware/     # Auth, RBAC, validation, error handling
│   │   │   ├── modules/       # Domain modules (leads, students, chat, ops, ...)
│   │   │   └── workers/       # BullMQ job processors
│   │   └── test/
│   └── web/              # Next.js frontend
│       └── src/
│           ├── app/           # Route groups: (internal), (public), (student), auth
│           ├── components/    # UI primitives + shared components
│           ├── features/      # Domain hooks (leads, students, ops, chat, ...)
│           ├── lib/           # API client, auth, guards, config
│           └── providers/     # Auth, React Query, Toast
├── packages/
│   ├── shared/           # Types, Zod schemas, constants (built with tsup)
│   └── config/           # Shared tsconfig, eslint, prettier
└── docs/
    └── architecture/     # Design docs (data model, API contracts, AI design, ...)
```

## Prerequisites

- Node.js >= 20
- PostgreSQL 16
- Redis 7
- Firebase project (Auth enabled)
- Groq API key

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/puneetrinity/stunning-octo-fortnight-sturec.git
cd stunning-octo-fortnight-sturec
npm install
```

### 2. Start infrastructure

**With Docker:**
```bash
docker compose up -d
```

**Without Docker** (if PostgreSQL and Redis are already running):
```bash
# Verify PostgreSQL and Redis are accessible
psql -U sturec -d sturec -c "SELECT 1"
redis-cli ping
```

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in the required values:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes | Firebase Admin SDK service account email |
| `FIREBASE_PRIVATE_KEY` | Yes | Firebase Admin SDK private key |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase web client API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase project ID (frontend) |
| `GROQ_API_KEY` | For AI | Groq API key for AI chat/assessment |

Also create `apps/web/.env.local` with the frontend variables:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

### 4. Set up database

```bash
# Build shared package first
cd packages/shared && npm run build && cd ../..

# Generate Prisma client
cd apps/api && npx prisma generate

# Push schema to database
npx prisma db push

# Seed with sample data
npx prisma db seed
```

### 5. Run

```bash
# Start both API and frontend
npm run dev

# Or individually:
cd apps/api && npm run dev    # API on http://localhost:3001
cd apps/web && npm run dev    # Frontend on http://localhost:3000
```

### 6. Run tests

```bash
# All tests (239 total)
npm test

# Backend only (164 tests)
cd apps/api && npm test

# Frontend only (75 tests)
cd apps/web && npm test
```

## Architecture

### Three Deployables

1. **API Server** (`apps/api`) - Fastify REST API, handles all business logic
2. **Worker** (`apps/api` in worker mode) - BullMQ job processors for async tasks
3. **Web** (`apps/web`) - Next.js frontend with three route groups

### Backend Module Pattern

Every module in `apps/api/src/modules/` follows:
```
routes.ts      -> Fastify route definitions
controller.ts  -> Request handling
service.ts     -> Business logic
repository.ts  -> Prisma queries (only place that imports Prisma)
schema.ts      -> Zod request/response schemas
```

### Frontend Route Groups

| Group | Path | Audience | Layout |
|-------|------|----------|--------|
| `(public)` | `/`, `/programs`, `/universities`, ... | Everyone | Marketing layout |
| `(internal)` | `/dashboard`, `/leads`, `/students`, ... | Admin, Counsellor | Sidebar + topbar |
| `(student)` | `/portal`, `/portal/documents`, ... | Students | Student sidebar |
| `auth` | `/auth/login`, `/auth/register` | Unauthenticated | Minimal |

### Role-Based Access

| Role | Dashboard | Leads/Students | Automations/Settings | Portal |
|------|-----------|---------------|---------------------|--------|
| Admin | Full view | Full CRUD | Full access | - |
| Counsellor | Assigned only | Assigned only | Redirects to `/dashboard` | - |
| Student | - | - | Redirects to `/portal` | Full access |

### 13-Stage Student Lifecycle

```
Lead Created -> Intake Completed -> Qualified -> Counsellor Consultation
-> Application Started -> Offer Confirmed -> Campus France Readiness
-> Visa File Readiness -> Visa Submitted -> Visa Decision
-> Arrival Onboarding -> Arrived in France -> Alumni
```

### Key Design Decisions

- **Backend is source of truth** - not Mautic, not Firebase, not the frontend
- **Student-AI chat is private** - counsellors see AI assessments only, never transcripts
- **All mutations emit BullMQ jobs** for side effects (Mautic sync, notifications, AI scoring)
- **Workers are idempotent** - every job checks if already processed before executing
- **Soft delete** on core tables (users, students, leads, documents)
- **No Prisma imports outside repository files** - services call repositories, controllers call services

## Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| Firebase Auth | Identity & token verification | Core |
| Groq AI | Student chat, profile assessment, lead scoring | Core |
| Google Cloud Storage | Document upload with signed URLs | Core |
| Mautic | CRM sync (downstream only, never source of truth) | Optional |
| Cal.com | Counsellor booking | Optional |
| WhatsApp/Sensy | Student notifications | Optional |
| Resend | Email notifications | Optional |

## API Overview

Base URL: `http://localhost:3001/api/v1`

| Module | Key Endpoints |
|--------|--------------|
| Auth | `POST /auth/verify`, `POST /auth/register`, `GET /users/me` |
| Leads | `GET /leads`, `POST /leads`, `POST /leads/:id/convert` |
| Students | `GET /students`, `GET /students/:id`, `POST /students/:id/stage` |
| Applications | `GET /applications`, `POST /applications`, `PATCH /applications/:id/status` |
| Documents | `POST /documents/upload-url`, `POST /documents/:id/verify` |
| Chat | `POST /chat/sessions`, `POST /chat/sessions/:id/messages` |
| Catalog | CRUD for universities, programs, intakes, visa rules, eligibility |
| Analytics | `GET /analytics/overview`, pipeline, counsellor, student stats |
| Ops | `GET /ops/queues`, `GET /ops/integrations`, `GET /ops/alerts` |

Full API contracts: [docs/architecture/04-api-contracts.md](docs/architecture/04-api-contracts.md)

## License

Private - All rights reserved.
