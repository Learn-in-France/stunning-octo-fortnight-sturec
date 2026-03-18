# Plan 1: Foundation

Turborepo scaffold, Prisma schema, Docker Compose, Firebase auth, user provisioning, middleware, shared packages.

**Depends on:** nothing
**Blocks:** all other plans

---

## Step 1: Monorepo Scaffold

### 1.1 Root setup
- Initialize root `package.json` with `workspaces: ["apps/*", "packages/*"]`
- Add `turbo.json` with pipelines: `build`, `dev`, `lint`, `test`, `db:generate`, `db:push`
- Add root `.gitignore` (node_modules, dist, .env*, .turbo, prisma generated)
- Add root `tsconfig.json` (base config, path aliases)
- Add `.nvmrc` with Node 20 LTS

### 1.2 `packages/config`
- `tsconfig/base.json` — strict mode, ESNext target, module resolution bundler
- `tsconfig/nextjs.json` — extends base, adds JSX, Next.js paths
- `tsconfig/node.json` — extends base, CommonJS interop
- `eslint/base.js` — shared ESLint config (TypeScript, import order, no unused vars)
- `prettier/index.js` — consistent formatting (single quotes, trailing commas, 100 print width)
- `package.json` — exports configs

### 1.3 `packages/shared`
- `src/types/index.ts` — re-exports all shared types
- `src/types/user.ts` — User, UserRole enum (`student`, `counsellor`, `admin`), UserStatus enum (`active`, `invited`, `deactivated`)
- `src/types/lead.ts` — Lead, LeadSource enum, LeadStatus enum
- `src/types/student.ts` — Student, StudentStage enum (all 13 stages), VisaRisk enum, EnglishTestType enum
- `src/types/catalog.ts` — University, Program, ProgramIntake, EligibilityRule, VisaRequirement, CampusFrancePrep
- `src/types/document.ts` — Document, DocumentType enum, DocumentStatus enum, StudentDocumentRequirement
- `src/types/chat.ts` — ChatSession, ChatMessage, ChatSessionStatus enum, MessageRole enum
- `src/types/ai-assessment.ts` — AiAssessment, AssessmentSourceType enum
- `src/types/application.ts` — Application, ApplicationStatus enum
- `src/types/activity.ts` — CounsellorActivityLog, ActivityType enum, ActivityChannel enum, ActivityDirection enum
- `src/types/api.ts` — PaginatedResponse<T>, ApiError, pagination params
- `src/constants/stages.ts` — Stage display names, stage order array, stage predecessor map
- `src/constants/scores.ts` — Routing thresholds (HIGH_FIT=7, MID_FIT=4, COMPLETENESS_THRESHOLD=0.8)
- `src/validation/index.ts` — re-exports
- `src/validation/auth.ts` — registerSchema, verifySchema
- `src/validation/pagination.ts` — paginationSchema (page, limit, sortBy, sortOrder)
- `package.json` — name `@sturec/shared`, main/types exports
- `tsconfig.json` — extends `@sturec/config/tsconfig/base.json`

### 1.4 `apps/web` — Next.js 15 shell
- `npx create-next-app@latest` with App Router, TypeScript, Tailwind, `src/` dir
- Remove boilerplate, add minimal `(public)/page.tsx` placeholder ("STUREC — coming soon")
- `src/lib/config/env.ts` — typed env vars (API_URL, FIREBASE_CONFIG)
- `src/providers/index.tsx` — root providers wrapper (placeholder for QueryClient, AuthProvider)
- `tsconfig.json` — extends `@sturec/config/tsconfig/nextjs.json`
- Verify `turbo dev --filter=web` starts on port 3000

### 1.5 `apps/api` — Fastify shell
- `package.json` — fastify, @fastify/cors, @fastify/helmet, @fastify/sensible, prisma, @prisma/client, zod, firebase-admin, tsx (dev), vitest
- `src/server.ts` — Fastify app creation, CORS config, health endpoint `GET /health`, route registration, listen on port 3001
- `src/lib/env.ts` — typed env vars with Zod validation for foundation requirements (DATABASE_URL, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
- `src/lib/logger.ts` — Fastify pino logger configuration
- `tsconfig.json` — extends `@sturec/config/tsconfig/node.json`
- Verify `turbo dev --filter=api` starts on port 3001

### 1.6 Docker Compose
- `docker-compose.yml` at repo root:
  - `postgres` service: image `postgres:16`, port 5432, volume for persistence, POSTGRES_DB=sturec, POSTGRES_USER=sturec, POSTGRES_PASSWORD=sturec
  - `redis` service: image `redis:7-alpine`, port 6379
- `.env.example` with all env vars documented

**Done when:** `docker-compose up -d && turbo dev` starts both apps, health endpoint returns 200.

---

## Step 2: Prisma Schema + Migrations

### 2.1 `apps/api/prisma/schema.prisma`
Implement the FULL data model from `docs/architecture/03-data-model.md`:

**Enums:**
- `UserRole` (student, counsellor, admin)
- `UserStatus` (active, invited, deactivated)
- `LeadSource` (marketing, university, referral, whatsapp, ads, manual)
- `LeadStatus` (new, nurturing, qualified, disqualified, converted)
- `StudentStage` (all 13: lead_created, intake_completed, qualified, counsellor_consultation, application_started, offer_confirmed, campus_france_readiness, visa_file_readiness, visa_submitted, visa_decision, arrival_onboarding, arrived_france, alumni)
- `EnglishTestType` (ielts, toefl, duolingo, none)
- `VisaRisk` (low, medium, high)
- `DocumentType` (passport, transcript, sop, financial_proof, accommodation, offer_letter, other)
- `DocumentStatus` (pending_upload, pending, verified, rejected)
- `RequirementSource` (visa, admission, housing, custom)
- `RequirementStatus` (missing, requested, uploaded, verified, rejected, waived)
- `ChatSessionStatus` (active, completed)
- `MessageRole` (user, assistant, system)
- `AssessmentSourceType` (chat, document, lead_form, manual_review, import)
- `ApplicationStatus` (draft, submitted, offer, rejected, enrolled)
- `NoteType` (general, visa, academic, finance, risk)
- `ActivityType` (call, whatsapp, email, meeting, follow_up, status_update, other)
- `ActivityChannel` (phone, whatsapp, email, video, in_person, internal, other)
- `ActivityDirection` (outbound, inbound, internal)
- `ConsentType` (whatsapp, email, parent_contact)
- `ConsentSource` (form, manual, import, webhook)
- `ChangedByType` (user, system, automation)
- `MauticEventType` (contact_created, contact_updated, campaign_triggered)
- `SyncStatus` (pending, sent, failed, retrying)
- `BookingStatus` (scheduled, completed, cancelled, no_show)
- `NotificationChannel` (email, whatsapp, sms)
- `NotificationStatus` (pending, sent, delivered, failed)

**Models (every table from data model doc):**
- User, Lead, Student, StageTransition, StudentAssignment
- Application, ChatSession, ChatMessage, AiAssessment
- Document, StudentDocumentRequirement, CounsellorNote, CounsellorActivityLog
- StudentContact, ConsentEvent
- University, Program, ProgramIntake, EligibilityRule, VisaRequirement, CampusFrancePrep
- MauticSyncLog, MauticCampaign, Booking, NotificationLog

**Key constraints:**
- Soft delete (`deletedAt DateTime?`) on User, Lead, Student, Document
- Unique on `User.firebaseUid`, `User.email`, `Student.referenceCode`
- Foreign keys as per data model
- `@@index` on frequently filtered columns (Lead.status, Student.stage, Student.assignedCounsellorId, Document.studentId, ChatSession.userId)
- `@@map` to snake_case table names

### 2.2 Generate and apply
- `npx prisma generate` — verify client generates
- `npx prisma db push` or `npx prisma migrate dev --name init` — apply to local Postgres
- Add `db:generate` and `db:push` scripts to `apps/api/package.json`

### 2.3 Seed script
- `apps/api/prisma/seed.ts` — create:
  - 1 admin user (firebase_uid placeholder)
  - 1 counsellor user
  - 2 universities, 3 programs, 2 intakes per program
  - 2 visa requirements, 1 eligibility rule, 1 campus france prep item
- Wire `prisma.seed` in package.json

**Done when:** `prisma db push` succeeds, `prisma studio` shows all tables, seed runs cleanly.

---

## Step 3: Firebase Auth Integration

### 3.1 `apps/api/src/integrations/firebase/index.ts`
- Initialize firebase-admin with service account from env vars (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
- Export `verifyFirebaseToken(idToken: string)` — calls `admin.auth().verifyIdToken(idToken)`, returns decoded token
- Handle expired/invalid tokens with clear error messages

### 3.2 Auth middleware — `apps/api/src/middleware/auth.ts`
- Extract `Authorization: Bearer <token>` header
- Call `verifyFirebaseToken`
- Look up user in PG by `firebase_uid`
- Attach `request.user = { id, firebaseUid, email, role, status }` to Fastify request
- If user not found in PG, return 401 with `USER_NOT_FOUND` code (frontend should call /auth/register)
- Decorate Fastify request type with user property

### 3.3 RBAC middleware — `apps/api/src/middleware/rbac.ts`
- `requireRole(...roles: UserRole[])` — Fastify preHandler that checks `request.user.role`
- Returns 403 with `INSUFFICIENT_PERMISSIONS` if role not in allowed list
- Separate helper: `requireOwnerOrRole(getOwnerId, ...roles)` — for student-own-data access

### 3.4 Auth module — `apps/api/src/modules/auth/`
Following module pattern (routes, controller, service, repository, schema, types):

**POST /auth/verify**
- Auth: Firebase token required
- Looks up user by firebase_uid, returns user profile + role
- If no user found, returns 401 `USER_NOT_FOUND`

**POST /auth/register**
- Auth: Firebase token required (new user)
- Upserts user: create with firebase_uid, email from token, role=student, status=active
- On creation: check if any lead exists with matching email → set `lead.user_id = newUser.id`
- Returns user profile
- Idempotent: if user already exists, return existing

**POST /auth/accept-invite**
- Auth: Firebase token required
- Finds user by email with status=invited
- Links firebase_uid, sets status=active
- Returns user profile

### 3.5 Validation schemas
- `packages/shared/src/validation/auth.ts`:
  - `verifyResponseSchema` — user object shape
  - `registerResponseSchema` — user object shape
  - `acceptInviteResponseSchema` — user object shape

**Done when:** POST /auth/register with a valid Firebase token creates a user, POST /auth/verify returns the user, middleware blocks unauthorized requests with proper error codes.

---

## Step 4: Error Handling & Validation Middleware

### 4.1 Global error handler — `apps/api/src/middleware/error-handler.ts`
- Catches all errors, formats to `{ error, code, details }` shape
- Zod validation errors → 400 with field-level details
- Prisma known errors (unique constraint, not found) → appropriate HTTP status
- Firebase auth errors → 401
- Unknown errors → 500, log full error, return generic message

### 4.2 Validation middleware — `apps/api/src/middleware/validation.ts`
- `validateBody(schema)` — Fastify preHandler, parses request.body with Zod schema
- `validateQuery(schema)` — same for query params
- `validateParams(schema)` — same for route params
- Attaches parsed/typed result to request

### 4.3 Request logging
- Log request method, URL, duration, status code
- Redact Authorization header content in logs

**Done when:** Invalid requests return structured Zod errors, auth failures return proper codes, unhandled errors are logged and return 500.

---

## Step 5: Tests

### 5.1 Test setup
- `vitest.config.ts` in `apps/api` — test setup, env vars for test DB
- Test utilities: `createTestApp()` (builds Fastify instance), `createTestUser()` (seeds a user), `mockFirebaseToken()` (stubs verifyIdToken)

### 5.2 Auth module tests
- POST /auth/register — creates user, returns profile
- POST /auth/register — idempotent (same Firebase UID returns existing user)
- POST /auth/register — links matching lead by email
- POST /auth/verify — returns user for valid token
- POST /auth/verify — returns 401 for unknown user
- POST /auth/accept-invite — links Firebase UID to invited user
- Middleware — blocks requests without token
- RBAC — blocks wrong role

**Done when:** `vitest run` passes all foundation auth and middleware tests.

---

## Step 6: Dev Experience & CI Prep

### 6.1 Scripts
- Root `package.json` scripts: `dev`, `build`, `lint`, `test`, `db:generate`, `db:push`, `db:seed`
- Turbo pipeline dependencies correct (build depends on db:generate)

### 6.2 Environment docs
- `.env.example` with every env var, commented by section
- `docs/dev-setup.md` — 5-step local setup guide (clone, docker-compose up, copy .env, prisma push + seed, turbo dev)

### 6.3 TypeScript strict checks
- No implicit any
- Strict null checks
- All packages build cleanly with `turbo build`

**Done when:** Fresh clone → `docker-compose up -d && cp .env.example .env && turbo build && turbo test` succeeds.

---

## Acceptance Criteria

- [ ] `turbo dev` starts both apps (web:3000, api:3001)
- [ ] `GET /health` returns 200
- [ ] Prisma schema matches data model doc — all tables, all columns, all enums
- [ ] `prisma db push` + `prisma db seed` run cleanly
- [ ] POST /auth/register with Firebase token creates user
- [ ] POST /auth/verify returns user profile
- [ ] Auth middleware rejects unauthenticated requests
- [ ] RBAC middleware rejects wrong roles
- [ ] POST /auth/accept-invite links invited team members correctly
- [ ] Error responses follow `{ error, code, details }` shape
- [ ] Zod validation errors return field-level details
- [ ] `packages/shared` exports all types and validation schemas
- [ ] All tests pass
- [ ] `.env.example` documents every env var
