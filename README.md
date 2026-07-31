# AI Growth

AI-powered conversion intelligence platform. The repository is a TypeScript monorepo with a Next.js dashboard and an Express API.

## Getting started

```bash
cp .env.example .env
npm install
npm run dev
```

- Dashboard: http://localhost:3000
- API health: http://localhost:4000/health
- RabbitMQ management: http://localhost:15672

The dashboard uses mock data by default while backend analytics endpoints are
being built. Set `NEXT_PUBLIC_USE_MOCK_DATA=false` to use the typed API adapter
against live `/api/v1/analytics/*` endpoints.

Database setup:

```bash
npm run db:generate --workspace @ai-growth/api
npm run db:migrate --workspace @ai-growth/api
npm run db:seed --workspace @ai-growth/api
```

The Prisma schema is in `prisma/schema.prisma`. It currently covers users,
organizations, organization memberships, and websites.

Database health is available at http://localhost:4000/health/db when the API is running.

Readiness is available at http://localhost:4000/ready. Run unit/contract tests with:

```bash
npm test
```

Production checks are grouped under `npm run ci`. Deployment and service configuration are documented in [DEPLOYMENT.md](DEPLOYMENT.md).

Start local infrastructure when needed:

```bash
docker compose up -d
```

The current foundation provides a runnable shell, health endpoint, and initial
multi-tenant database model. Authentication, website management, tracking, and
analytics are next milestones.
