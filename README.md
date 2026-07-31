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

Database setup:

```bash
npm run db:generate --workspace @ai-growth/api
npm run db:migrate --workspace @ai-growth/api
```

The Prisma schema is in `prisma/schema.prisma`. It currently covers users,
organizations, organization memberships, and websites.

Start local infrastructure when needed:

```bash
docker compose up -d
```

The current foundation provides a runnable shell, health endpoint, and initial
multi-tenant database model. Authentication, website management, tracking, and
analytics are next milestones.
