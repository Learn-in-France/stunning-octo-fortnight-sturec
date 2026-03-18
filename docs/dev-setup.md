# Local Development Setup

## Prerequisites

- Node.js 20 LTS (see `.nvmrc`)
- Docker (for PostgreSQL and Redis)
- Firebase project with Auth enabled

## Steps

1. **Clone and install**
   ```bash
   git clone <repo-url> && cd sturec
   npm install
   ```

2. **Start infrastructure**
   ```bash
   docker compose up -d
   ```
   This starts PostgreSQL (port 5432) and Redis (port 6379).

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Fill in Firebase credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).

4. **Set up database**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

5. **Start development**
   ```bash
   npm run dev
   ```
   - Web: http://localhost:3000
   - API: http://localhost:3001
   - Health: http://localhost:3001/health

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all apps in dev mode |
| `npm run build` | Build all packages |
| `npm run test` | Run all tests |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed database with sample data |
| `npx prisma studio` | Open database GUI (from apps/api) |

## Project Structure

```
sturec/
├── apps/
│   ├── web/          # Next.js frontend (Lane 2)
│   └── api/          # Fastify backend (Lane 1)
├── packages/
│   ├── shared/       # Types, validation, constants, fixtures
│   └── config/       # Shared tsconfig, eslint, prettier
├── docs/             # Architecture and setup docs
└── docker-compose.yml
```
