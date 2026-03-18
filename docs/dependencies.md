# STUREC — Dependencies Reference

Verified via Context7 (2026-03-16). Use these exact packages and patterns when implementing.

---

## Package Manager

**npm** with npm workspaces.

```json
// root package.json
{
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "db:generate": "turbo run db:generate",
    "db:push": "turbo run db:push",
    "db:seed": "turbo run db:seed"
  },
  "devDependencies": {
    "turbo": "^2.x"
  },
  "packageManager": "npm@10.x.x"
}
```

---

## Turborepo

**Package:** `turbo`

```jsonc
// turbo.json
{
  "$schema": "https://turborepo.dev/schema.json",
  "globalDependencies": [".env"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "db:generate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    }
  }
}
```

---

## Frontend — `apps/web`

### Next.js 15 + React 19

**Packages:**
```bash
npm install next@latest react@latest react-dom@latest
npm install -D typescript @types/react @types/react-dom @types/node eslint-config-next@latest
```

- App Router with `src/` directory
- TypeScript strict mode
- Scaffold: `npx create-next-app@latest apps/web --typescript --eslint --app --src-dir`

### Tailwind CSS v4

**Packages:**
```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

**PostCSS config (`postcss.config.mjs`):**
```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

**CSS entry (`globals.css`):**
```css
@import "tailwindcss";
```

> Tailwind v4 does NOT use `tailwind.config.js`. Configuration is done via CSS with `@theme` directives. No `content` array needed — it auto-detects.

### TanStack React Query v5

**Package:**
```bash
npm install @tanstack/react-query
```

**Setup:**
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
    },
  },
})

function App({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

**Hook patterns (v5 — single object arg):**
```typescript
// Query
const { data, isPending, error } = useQuery({
  queryKey: ['students', filters],
  queryFn: () => api.get('/students', { params: filters }),
})

// Mutation with cache invalidation
const mutation = useMutation({
  mutationFn: (data) => api.post('/students/:id/stage', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['students'] })
  },
})
```

### Firebase Client SDK (Auth)

**Package:**
```bash
npm install firebase
```

**Setup:**
```typescript
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
})

const auth = getAuth(app)

// Google sign-in
const provider = new GoogleAuthProvider()
const result = await signInWithPopup(auth, provider)
const user = result.user

// Get ID token for backend calls
const idToken = await user.getIdToken()

// Auth state observer
onAuthStateChanged(auth, (user) => {
  if (user) { /* signed in */ }
  else { /* signed out */ }
})
```

### Axios (API Client)

**Package:**
```bash
npm install axios
```

**Setup with auth interceptor:**
```typescript
import axios from 'axios'
import { getAuth } from 'firebase/auth'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/api/v1',
})

api.interceptors.request.use(async (config) => {
  const auth = getAuth()
  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // redirect to login
    }
    return Promise.reject(error.response?.data || error)
  }
)

export default api
```

### Recharts (Analytics Charts)

**Package:**
```bash
npm install recharts
```

Used in Plan 7 for analytics dashboards: bar, line, pie, funnel charts.

---

## Backend — `apps/api`

### Fastify

**Packages:**
```bash
npm install fastify @fastify/cors @fastify/helmet @fastify/sensible @fastify/multipart
npm install -D @types/node tsx
```

**Server setup:**
```typescript
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import sensible from '@fastify/sensible'

const server = Fastify({ logger: true })

await server.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
})
await server.register(helmet)
await server.register(sensible)

server.get('/health', async () => ({ status: 'ok' }))

// Register module routes
// await server.register(authRoutes, { prefix: '/api/v1' })

await server.listen({ port: parseInt(process.env.PORT || process.env.API_PORT || '3001'), host: '0.0.0.0' })
```

### Prisma ORM

**Packages:**
```bash
npm install @prisma/client
npm install -D prisma
```

**Schema header (`prisma/schema.prisma`):**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

**Commands:**
```bash
npx prisma generate          # Generate client from schema
npx prisma migrate dev --name init  # Create and apply migration
npx prisma db push           # Push schema without migration file (dev)
npx prisma studio            # GUI data browser
```

**Client usage pattern (repository files only):**
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
export default prisma
```

### Firebase Admin SDK

**Package:**
```bash
npm install firebase-admin
```

**Setup:**
```typescript
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
})

// Verify ID token from client
async function verifyFirebaseToken(idToken: string) {
  const decodedToken = await getAuth().verifyIdToken(idToken)
  return decodedToken // { uid, email, ... }
}
```

**Error codes to handle:**
- `auth/id-token-expired` → 401
- `auth/invalid-id-token` → 401
- `auth/argument-error` → 400
- `auth/user-disabled` → 403

### Groq SDK

**Package:**
```bash
npm install groq-sdk
```

**Setup:**
```typescript
import Groq from 'groq-sdk'
import type {
  ChatCompletion,
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
} from 'groq-sdk/resources/chat/completions'

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

async function chatCompletion(messages: ChatCompletionMessageParam[]) {
  const params: ChatCompletionCreateParams = {
    messages,
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 2048,
  }

  const completion: ChatCompletion = await client.chat.completions.create(params)
  return completion.choices[0].message
}
```

**Error handling:**
```typescript
import Groq from 'groq-sdk'

try {
  const result = await client.chat.completions.create(params)
} catch (error) {
  if (error instanceof Groq.RateLimitError) {
    // 429 — retry with backoff
  } else if (error instanceof Groq.APIConnectionError) {
    // network issue
  } else if (error instanceof Groq.APIError) {
    // general API error — error.status, error.message
  }
}
```

### Zod

**Package:**
```bash
npm install zod
```

> Use Zod v3 (stable). Zod v4 exists but is very new. Stick with v3 for reliability.

**Pattern:**
```typescript
import { z } from 'zod'

const CreateLeadSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  source: z.enum(['marketing', 'university', 'referral', 'whatsapp', 'ads', 'manual']),
  phone: z.string().optional(),
})

type CreateLeadInput = z.infer<typeof CreateLeadSchema>

// Validation
const result = CreateLeadSchema.safeParse(requestBody)
if (!result.success) {
  // result.error.flatten() for field-level errors
}
```

### BullMQ

**Package:**
```bash
npm install bullmq
```

**Queue setup:**
```typescript
import { Queue } from 'bullmq'

const connection = { host: 'localhost', port: 6379 }

const mauticSyncQueue = new Queue('mautic-sync', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { age: 7 * 24 * 3600 },
  },
})

const aiProcessingQueue = new Queue('ai-processing', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 5000 },
  },
})

// Add a job
await mauticSyncQueue.add('contact_created', {
  entityId: student.id,
  eventType: 'contact_created',
  triggeringActionId: stageTransition.id,
})
```

**Worker setup:**
```typescript
import { Worker, Job } from 'bullmq'

const worker = new Worker('mautic-sync', async (job: Job) => {
  const { entityId, eventType } = job.data
  // process job...
}, {
  connection: { host: 'localhost', port: 6379 },
  concurrency: 5,
})

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed: ${err.message}`)
})
```

### ioredis

**Package:**
```bash
npm install ioredis
```

**Setup:**
```typescript
import Redis from 'ioredis'

// From URL (Railway provides REDIS_URL)
const redis = new Redis(process.env.REDIS_URL)

// Or with options
const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: null, // required by BullMQ
})

// Idempotency helper
async function checkAndMarkProcessed(key: string): Promise<boolean> {
  const result = await redis.set(key, '1', 'EX', 86400, 'NX')
  return result === null // true = already processed
}
```

> **Important:** BullMQ requires `maxRetriesPerRequest: null` on the Redis connection.

### Bull Board

**Packages:**
```bash
npm install @bull-board/api @bull-board/fastify @bull-board/ui
```

Used for the internal admin queue monitor described in the queue architecture doc.

**Setup sketch:**
```typescript
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { FastifyAdapter } from '@bull-board/fastify'

const serverAdapter = new FastifyAdapter()
serverAdapter.setBasePath('/admin/queues')

createBullBoard({
  queues: [
    new BullMQAdapter(mauticSyncQueue),
    new BullMQAdapter(aiProcessingQueue),
  ],
  serverAdapter,
})

await server.register(serverAdapter.registerPlugin(), {
  prefix: '/admin/queues',
})
```

### CSV Parsing (Lead Import)

**Package:**
```bash
npm install csv-parse
```

Used by `POST /leads/import` (Plan 2) to parse uploaded CSV files row-by-row.

**Pattern:**
```typescript
import { parse } from 'csv-parse/sync'

const records = parse(csvBuffer, {
  columns: true,        // use first row as header
  skip_empty_lines: true,
  trim: true,
})
// records = [{ email: '...', first_name: '...', ... }, ...]
```

### Email SDK (Resend)

**Package:**
```bash
npm install resend
```

Default email provider for Plan 6 notifications. Swap to SES/SMTP via `EMAIL_PROVIDER` env var.

**Setup:**
```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.EMAIL_API_KEY)

await resend.emails.send({
  from: process.env.EMAIL_FROM!,
  to: recipient,
  subject: 'Your document has been verified',
  html: '<p>Your transcript has been verified by your counsellor.</p>',
})
```

### Google Cloud Storage

**Package:**
```bash
npm install @google-cloud/storage
```

**Setup:**
```typescript
import { Storage } from '@google-cloud/storage'

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCS_CLIENT_EMAIL,
    private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
})

const bucket = storage.bucket(process.env.GCS_BUCKET!)

// Generate signed upload URL
async function generateSignedUploadUrl(path: string, contentType: string) {
  const file = bucket.file(path)
  const [url] = await file.generateSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType,
  })
  return url
}

// Generate signed download URL
async function generateSignedDownloadUrl(path: string) {
  const file = bucket.file(path)
  const [url] = await file.generateSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000,
  })
  return url
}

// Check file exists
async function checkFileExists(path: string): Promise<boolean> {
  const [exists] = await bucket.file(path).exists()
  return exists
}
```

---

## Testing — `apps/api`

### Vitest

**Packages:**
```bash
npm install -D vitest
```

**Config (`vitest.config.ts`):**
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    },
    testTimeout: 10000,
    clearMocks: true,
    restoreMocks: true,
  },
})
```

**TypeScript support — add to `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

---

## Testing — `apps/web`

Component and route-level tests used in Plans 4-7.

**Packages:**
```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Typical setup (`vitest.setup.ts`):**
```typescript
import '@testing-library/jest-dom/vitest'
```

**Config sketch:**
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

---

## Shared — `packages/shared`

Only Zod and TypeScript. No runtime deps beyond `zod`.

```bash
npm install zod
npm install -D typescript
```

---

## Infrastructure

### Docker Compose (Local Dev)

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: sturec
      POSTGRES_USER: sturec
      POSTGRES_PASSWORD: sturec
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

---

## Environment Variables

```bash
# === Database ===
DATABASE_URL=postgresql://sturec:sturec@localhost:5432/sturec

# === Redis ===
REDIS_URL=redis://localhost:6379

# === Firebase (Backend — Admin SDK) ===
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# === Firebase (Frontend — Client SDK) ===
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=

# === Groq AI ===
GROQ_API_KEY=

# === Google Cloud Storage ===
GCP_PROJECT_ID=
GCS_BUCKET=
GCS_CLIENT_EMAIL=
GCS_PRIVATE_KEY=

# === Mautic ===
MAUTIC_URL=
MAUTIC_CLIENT_ID=
MAUTIC_CLIENT_SECRET=
MAUTIC_WEBHOOK_SECRET=

# === Cal.com ===
CALCOM_API_KEY=
CALCOM_WEBHOOK_SECRET=

# === WhatsApp / Sensy ===
WHATSAPP_PROVIDER=whatsapp_api  # or sensy
WHATSAPP_API_KEY=
WHATSAPP_API_URL=
WHATSAPP_WEBHOOK_SECRET=

# === Email ===
EMAIL_PROVIDER=resend  # or ses, smtp
EMAIL_API_KEY=
EMAIL_FROM=noreply@sturec.com

# === App ===
FRONTEND_URL=http://localhost:3000
API_PORT=3001
NODE_ENV=development
```

---

## Full Dependency Summary

| Package | Version | Where | Purpose |
|---------|---------|-------|---------|
| `turbo` | ^2.x | root | Monorepo task runner |
| `next` | ^15.x | web | Frontend framework |
| `react` / `react-dom` | ^19.x | web | UI library |
| `tailwindcss` | ^4.x | web | Utility CSS (v4, no config file) |
| `@tailwindcss/postcss` | ^4.x | web | PostCSS integration |
| `@tanstack/react-query` | ^5.x | web | Server state management |
| `firebase` | ^11.x | web | Client auth SDK |
| `axios` | ^1.x | web | HTTP client |
| `recharts` | ^2.x | web | Charts for analytics |
| `fastify` | ^5.x | api | HTTP framework |
| `@fastify/cors` | ^10.x | api | CORS plugin |
| `@fastify/helmet` | ^12.x | api | Security headers |
| `@fastify/sensible` | ^6.x | api | Error utilities |
| `@fastify/multipart` | ^9.x | api | File upload parsing (CSV import) |
| `@prisma/client` | ^6.x | api | Database ORM client |
| `prisma` | ^6.x | api (dev) | Schema tooling, migrations |
| `firebase-admin` | ^13.x | api | Token verification |
| `groq-sdk` | ^0.x | api | LLM API client |
| `bullmq` | ^5.x | api | Job queue |
| `@bull-board/api` | ^6.x | api | Queue monitoring API |
| `@bull-board/fastify` | ^6.x | api | Fastify adapter for Bull Board |
| `@bull-board/ui` | ^6.x | api | Bull Board UI assets |
| `ioredis` | ^5.x | api | Redis client (BullMQ + idempotency) |
| `csv-parse` | ^5.x | api | CSV parsing for lead import |
| `resend` | ^4.x | api | Email sending (default provider) |
| `@google-cloud/storage` | ^7.x | api | File storage, signed URLs |
| `zod` | ^3.x | shared, api | Schema validation |
| `vitest` | ^3.x | api (dev) | Test runner |
| `jsdom` | ^26.x | web (dev) | Browser-like test environment |
| `@testing-library/react` | ^16.x | web (dev) | Component testing |
| `@testing-library/jest-dom` | ^6.x | web (dev) | DOM assertions |
| `@testing-library/user-event` | ^14.x | web (dev) | User interaction testing |
| `tsx` | ^4.x | api (dev) | Run TypeScript directly in dev mode |
| `typescript` | ^5.x | all (dev) | Type system |

---

## Railway Deployment

3 services deployed from this monorepo. Railway uses **Railpack** as the default builder for new services, with Nixpacks now deprecated for new work. Railpack auto-detects Node.js, installs dependencies, builds, and packages the application with minimal configuration.

### Build System: Railpack

- **Default builder** — no Dockerfile needed. Railpack detects language, installs runtimes, runs build commands, and packages the result.
- **Replaces Nixpacks for new services** — Nixpacks is deprecated and in maintenance mode. New services default to Railpack.
- **Benefits** — Railway positions Railpack as the zero-config default with customizable build/install/start behavior, package installation controls, and build caching support.
- **Override install command**: set `RAILPACK_INSTALL_COMMAND` env var if needed.
- **Extra system packages**: set `RAILPACK_BUILD_APT_PACKAGES` (build-time) or `RAILPACK_DEPLOY_APT_PACKAGES` (runtime).
- **Disable cache**: set `NO_CACHE=1` to force clean build.

### Monorepo Strategy

Railway auto-detects npm workspaces monorepos on import and stages a service per deployable package. It auto-configures:
- Service names from package identifiers
- Build/start commands with workspace filters
- Watch paths pointing to package directories

For our monorepo (shared type — packages share common root), we use **Config as Code** with `railway.json` files per service for reproducibility.

### Service Configuration

| Railway Service | Type | Root Dir | Build Command | Start Command | Health Check |
|----------------|------|----------|---------------|---------------|-------------|
| `sturec-web` | Web | `/` | `npm run build --workspace=apps/web` | `npm run start --workspace=apps/web` | `/` |
| `sturec-api` | Web | `/` | `npm run build --workspace=apps/api` | `node apps/api/dist/server.js` | `/health` |
| `sturec-worker` | Worker | `/` | `npm run build --workspace=apps/api` | `node apps/api/dist/worker.js` | *(none)* |

> **Root Directory = `/`** for shared monorepos. Railway builds from the repo root so workspace deps resolve correctly. Build/start commands target specific workspaces.

### Config as Code

Railway reads `railway.toml` or `railway.json` alongside your code. Config in code **overrides** dashboard settings. For monorepos, use absolute paths (e.g., `/apps/api/railway.toml`).

**`apps/web/railway.json`** (frontend):
```json
{
  "build": {
    "builder": "RAILPACK",
    "buildCommand": "npx turbo run build --filter=web",
    "watchPatterns": ["apps/web/**", "packages/shared/**"]
  },
  "deploy": {
    "startCommand": "npm run start --workspace=apps/web",
    "healthcheckPath": "/",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5
  }
}
```

**`apps/api/railway.json`** (API server):
```json
{
  "build": {
    "builder": "RAILPACK",
    "buildCommand": "npx turbo run build --filter=api",
    "watchPatterns": ["apps/api/**", "packages/shared/**"]
  },
  "deploy": {
    "startCommand": "node apps/api/dist/server.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5,
    "preDeployCommand": ["npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma"]
  }
}
```

**`apps/api/railway.worker.json`** (worker — separate config file, linked in dashboard):
```json
{
  "build": {
    "builder": "RAILPACK",
    "buildCommand": "npx turbo run build --filter=api",
    "watchPatterns": ["apps/api/**", "packages/shared/**"]
  },
  "deploy": {
    "startCommand": "node apps/api/dist/worker.js",
    "restartPolicyType": "ALWAYS"
  }
}
```

### Watch Paths

Gitignore-style patterns that control when a deploy is triggered. Changes outside these patterns skip deployment:
- `apps/web/**` — only web changes trigger web service deploy
- `apps/api/**` — only API changes trigger API/worker deploys
- `packages/shared/**` — shared package changes trigger all services

### Railway Add-ons
- **PostgreSQL** — Railway managed, provides `DATABASE_URL` automatically
- **Redis** — Railway add-on, provides `REDIS_URL` automatically

### Pre-Deploy Command

Used for database migrations. Runs **after** build but **before** the new deployment receives traffic:
```json
{
  "deploy": {
    "preDeployCommand": ["npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma"]
  }
}
```

### Environment Overrides

Railway supports per-environment config:
```json
{
  "environments": {
    "staging": {
      "deploy": {
        "startCommand": "NODE_ENV=staging node apps/api/dist/server.js"
      }
    }
  }
}
```

### Railway-Specific Notes

1. **Shared env vars**: Use Railway's shared variables for secrets used by multiple services (Firebase keys, Groq key, GCS credentials). Use reference variables for inter-service communication: `FRONTEND_URL=${{sturec-web.RAILWAY_PUBLIC_DOMAIN}}`.

2. **Private networking**: API and worker should communicate with Postgres/Redis over Railway's private network (`*.railway.internal`) for lower latency. Set `DATABASE_URL` and `REDIS_URL` to internal addresses in production.

3. **Port binding**: Railway sets `PORT` env var. Both Next.js and Fastify must respect it:
   ```typescript
   // Fastify
   await server.listen({ port: parseInt(process.env.PORT || '3001'), host: '0.0.0.0' })
   ```
   Next.js respects `PORT` automatically via `next start`.

4. **Worker has no port**: The worker process doesn't listen on a port — it just processes BullMQ jobs. Configure the worker service as a **Worker** type (not Web) in Railway — no health check, `restartPolicyType: "ALWAYS"`.

5. **Prisma on Railpack**: Railpack builds on Linux. Prisma auto-detects the binary target. No `binaryTargets` override needed (unlike Dockerfiles).

6. **Firebase private key**: Railway stores multiline env vars with literal `\n`. The `replace(/\\n/g, '\n')` pattern in the Firebase Admin setup handles this.

7. **No file system persistence**: Railway containers are ephemeral. All file uploads go to GCS (never local disk). Logs go to stdout (Railway captures them).

8. **Redis connection for BullMQ**: When using Railway's Redis URL, parse it through ioredis:
   ```typescript
   import Redis from 'ioredis'
   const connection = new Redis(process.env.REDIS_URL!, {
     maxRetriesPerRequest: null, // required by BullMQ
   })
   ```

9. **Railpack environment variables**: Use these if you need to customize the build:
   - `RAILPACK_INSTALL_COMMAND` — override install command
   - `RAILPACK_BUILD_APT_PACKAGES` — add system packages at build time
   - `RAILPACK_DEPLOY_APT_PACKAGES` — add system packages to runtime image
   - `NO_CACHE=1` — force clean build (disables layer caching)

---

## Key Gotchas

1. **Tailwind v4**: No `tailwind.config.js`. Use `@import "tailwindcss"` in CSS and `@tailwindcss/postcss` plugin. Auto-detects content.
2. **React Query v5**: All hooks take a single object argument (`{ queryKey, queryFn, ...options }`). No positional args.
3. **BullMQ + ioredis**: Connection MUST set `maxRetriesPerRequest: null`.
4. **Firebase Admin private key**: Must `replace(/\\n/g, '\n')` when loading from env vars (Railway/Docker escape newlines).
5. **Prisma**: Only import in `repository.ts` files. Never in services or controllers.
6. **Zod v3**: Stick with v3.x. Zod v4 is too new for production.
7. **Fastify v5**: Use `await server.register()` pattern (async). Plugin registration is async-first.
8. **GCS signed URLs**: v4 signature, 15-min expiry for uploads, 15-min for downloads.
