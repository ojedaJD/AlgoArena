# AlgoArena - Competitive Programming Platform

A full-stack competitive programming platform where users can solve algorithmic problems, track progress across topics, and compete on leaderboards — all in a modern, fast monorepo.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo tooling | [Turborepo](https://turbo.build) + npm workspaces |
| API | Node.js · [Fastify](https://fastify.dev) · TypeScript |
| ORM | [Prisma](https://www.prisma.io) |
| Database | PostgreSQL 16 |
| Cache / queue | Redis 7 |
| Auth | Auth0 (JWT verification) |
| Frontend | [Next.js 14](https://nextjs.org) · TypeScript · Tailwind CSS |
| Code execution | Isolated Docker sandbox (per-language runner containers) |
| CI | GitHub Actions |
| Containerisation | Docker · Docker Compose |

---

## Architecture Overview

```
DSAProject/                    ← monorepo root
├── apps/
│   ├── api/                   ← Fastify REST API
│   │   ├── prisma/            ← schema, migrations, seed
│   │   ├── src/
│   │   │   ├── routes/        ← problems, submissions, users, topics
│   │   │   ├── services/      ← business logic
│   │   │   └── plugins/       ← auth, prisma, redis plugins
│   │   └── Dockerfile
│   └── web/                   ← Next.js frontend
│       ├── app/               ← App Router pages
│       ├── components/        ← UI components
│       └── Dockerfile
└── packages/
    └── shared/                ← shared TypeScript types & utilities
        └── src/
            └── types/         ← Zod schemas, enums, DTOs
```

The **API** exposes a JSON REST interface over HTTPS. Auth0 issues JWTs; every protected route validates the token via the `@fastify/jwt` plugin.

The **web** client is a Next.js application that fetches data from the API. The Monaco editor powers the in-browser code editor.

**Code execution** happens in ephemeral Docker containers spawned by the API's runner service. Each language has a dedicated image that compiles/runs user code, enforces memory and CPU limits, and returns stdout/stderr.

**Shared** types live in `packages/shared` and are imported by both `api` and `web`, keeping request/response shapes in sync at compile time.

---

## Prerequisites

- **Node.js** 20 or later
- **npm** 10 or later (ships with Node 20)
- **Docker** 24+ and **Docker Compose** v2
- **PostgreSQL** 16 (or use the bundled Compose service)
- **Redis** 7 (or use the bundled Compose service)

---

## Quick Start

### 1. Clone and install dependencies

```bash
git clone https://github.com/your-org/algoarena.git
cd algoarena
npm install          # installs all workspace dependencies via npm workspaces
```

### 2. Configure environment variables

```bash
# API
cp apps/api/.env.example apps/api/.env

# Web
cp apps/web/.env.example apps/web/.env.local
```

Minimum variables required in `apps/api/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dsaarena"
REDIS_URL="redis://localhost:6379"
AUTH0_DOMAIN="your-tenant.auth0.com"
AUTH0_AUDIENCE="https://api.dsaarena.dev"
JWT_SECRET="change-me-in-production"
NODE_ENV="development"
PORT=4000
```

Minimum variables required in `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_AUTH0_DOMAIN="your-tenant.auth0.com"
NEXT_PUBLIC_AUTH0_CLIENT_ID="your-auth0-client-id"
```

### 3. Start backing services with Docker Compose

```bash
docker compose up -d          # starts postgres + redis
```

### 4. Run database migrations

```bash
cd apps/api
npx prisma migrate dev --name init
```

### 5. Seed the database

```bash
npx prisma db seed
```

This creates 5 topics, 10 lessons, 10 problems (with test cases), and an admin user.

### 6. Start the development servers

```bash
# from the monorepo root
npm run dev
```

Turborepo runs `dev` in all workspaces in parallel:

| Service | URL |
|---|---|
| API | http://localhost:4000 |
| Web | http://localhost:3000 |

---

## Project Structure

```
DSAProject/
├── .github/
│   └── workflows/
│       ├── ci.yml             ← lint · typecheck · build on every PR
│       └── deploy.yml         ← build Docker images, push to registry, deploy
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   ├── index.ts       ← server entrypoint
│   │   │   ├── plugins/
│   │   │   ├── routes/
│   │   │   └── services/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── problems/
│       │   └── topics/
│       ├── components/
│       │   ├── editor/
│       │   └── ui/
│       ├── Dockerfile
│       ├── next.config.ts
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── shared/
│       ├── src/
│       │   └── types/
│       ├── package.json
│       └── tsconfig.json
├── docker-compose.yml
├── package.json               ← workspace root, Turbo config
├── turbo.json
└── README.md
```

---

## Available Scripts

Run from the **monorepo root** unless noted.

| Command | Description |
|---|---|
| `npm run dev` | Start all apps in development mode (via Turbo) |
| `npm run build` | Build all packages and apps for production |
| `npm run lint` | Run ESLint across all workspaces |
| `npm run typecheck` | Run `tsc --noEmit` across all workspaces |
| `npm run test` | Run test suites across all workspaces |
| `npm run format` | Format code with Prettier |

Run from **`apps/api`**:

| Command | Description |
|---|---|
| `npx prisma migrate dev` | Create and apply a new migration |
| `npx prisma migrate deploy` | Apply pending migrations in production |
| `npx prisma db seed` | Seed the database with sample data |
| `npx prisma studio` | Open Prisma Studio (database GUI) |

---

## License

MIT License — see [LICENSE](./LICENSE) for details.
