# Deployment and production readiness

## Required services

- Hosted PostgreSQL for Prisma migrations and account data
- RabbitMQ for event delivery, retries, and dead letters
- Redis for active-session state and distributed rate limits
- ClickHouse with `apps/api/sql/events.sql` applied before enabling analytics persistence

## Environment

Copy `.env.example` into the deployment environment and replace all development values:

- `DATABASE_URL`
- `JWT_SECRET`
- `ENCRYPTION_KEY` (64 hexadecimal characters)
- `CORS_ORIGINS`
- `RABBITMQ_URL`
- `REDIS_URL`
- `CLICKHOUSE_URL`

Enable the pipeline only after the external services are reachable:

```env
EVENT_PIPELINE_ENABLED=true
REDIS_ENABLED=true
CLICKHOUSE_ENABLED=true
```

## Release checks

```bash
npm ci
npm run db:validate --workspace @ai-growth/api
npm run db:generate --workspace @ai-growth/api
npm run typecheck
npm test
npm run build
```

Apply pending Prisma migrations during deployment with the migration runner appropriate to the environment. Do not run `prisma migrate dev` against production.

The API workspace provides production-safe infrastructure commands:

```bash
npm run infra:check --workspace @ai-growth/api
npm run db:migrate:deploy --workspace @ai-growth/api
npm run clickhouse:schema --workspace @ai-growth/api
npm run infra:check:services --workspace @ai-growth/api
```

Run `infra:check` with the deployment environment loaded. It rejects development placeholders, localhost origins, weak encryption keys, and disabled production services. `infra:check:services` performs non-mutating connectivity checks for RabbitMQ, Redis, and ClickHouse. Apply the ClickHouse schema only after the ClickHouse database/user and network policy are ready.

## Health checks

- `/health` — process health
- `/health/db` — database connectivity
- `/health/pipeline` — event pipeline metrics/state
- `/ready` — database readiness and enabled pipeline readiness

## Integration tests

Unit/contract tests run without external services. Opt-in API integration checks require a running API:

```bash
RUN_INTEGRATION_TESTS=true npm run test:integration --workspace @ai-growth/api
```

## Operational requirements

- Send logs to a structured log collector and redact authorization headers and request bodies.
- Monitor 5xx rates, queue depth, retry/dead-letter counts, ClickHouse insert failures, and database latency.
- Rotate `JWT_SECRET` and `ENCRYPTION_KEY` through a secrets manager; key rotation requires a planned re-encryption process.
- Configure retention and deletion jobs for visitor event data before public launch.

## Provisioning order

1. Create isolated production resources and private network access for PostgreSQL, RabbitMQ, Redis, and ClickHouse.
2. Store the environment values in the deployment platform’s secret manager; do not commit `.env` files.
3. Run the environment validator, then deploy Prisma migrations.
4. Apply the ClickHouse event schema and run the service connectivity checks.
5. Deploy the API with pipeline flags disabled, confirm `/health/db`, then enable the pipeline and verify `/ready`.
6. Record backup, retention, restore-test, and on-call ownership before accepting production traffic.
