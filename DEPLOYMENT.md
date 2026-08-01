# Deployment and production readiness

## Free MVP services

- Neon PostgreSQL for Prisma migrations, account data, events, and analytics
- One free API web service
- One free dashboard web service

RabbitMQ, Redis, and ClickHouse are not required for the free MVP. Keep the
event pipeline disabled and use PostgreSQL event storage and analytics.

## Environment

Copy `.env.example` into the deployment environment and replace all development values:

- `DATABASE_URL`
- `JWT_SECRET`
- `BILLING_WEBHOOK_SECRET` (required before enabling billing webhooks)
- `ENCRYPTION_KEY` (64 hexadecimal characters)
- `CORS_ORIGINS`
- `POSTGRES_EVENT_STORAGE_ENABLED=true`
- `ANALYTICS_STORAGE=postgres`
- `FREE_MVP_MODE=true`

Free MVP settings:

```env
FREE_MVP_MODE=true
ANALYTICS_STORAGE=postgres
POSTGRES_EVENT_STORAGE_ENABLED=true
EVENT_PIPELINE_ENABLED=false
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
```

Run `infra:check` with the deployment environment loaded. In explicit free MVP
mode it validates the database, secrets, and public CORS origins without
requiring RabbitMQ, Redis, or ClickHouse.

## Render Blueprint

The repository includes `render.yaml` for two free web services. In Render,
create a Blueprint from the repository and provide the four `sync: false`
values. Use the deployed dashboard URL as `CORS_ORIGINS`. The current API URL
is configured as `https://ai-growth-api-ooi0.onrender.com`; update it if Render
assigns a different service URL.

Set the API `TRACKING_SCRIPT_URL` to the deployed API tracker endpoint so
generated installation snippets never point to localhost:
`https://ai-growth-api-ooi0.onrender.com/tracker.js`.

Set `NEXT_PUBLIC_USE_MOCK_DATA=false` for the dashboard so deployed routes use
the live API and require authentication.

The API uses Render's `PORT` value automatically, runs Prisma migrations before
starting the API, and exposes `/health` for the service health check. Free web
services can sleep when idle, so the first request after inactivity may be
slow.

## Password reset

The login page includes `/forgot-password` and `/reset-password`. Reset tokens
are one-time and expire after 30 minutes; resetting a password also revokes all
existing refresh sessions.

The free MVP does not include an email provider. In local development, the
forgot-password response includes a test reset link. In production it returns
the same generic response but deliberately does not expose a token, so an email
delivery provider must be connected before offering self-service recovery on a
public deployment. This avoids putting account-reset tokens in browser responses
or public logs.

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
- Monitor 5xx rates, event acceptance, retention cleanup counts, free-tier
  quotas, and database latency. Queue, retry, and ClickHouse metrics apply only
  if those optional services are introduced later.
- Rotate `JWT_SECRET` and `ENCRYPTION_KEY` through a secrets manager; key rotation requires a planned re-encryption process.
- Configure retention and deletion jobs for visitor event data before public launch.

### Privacy operations

- Set `EVENT_RETENTION_DAYS` for the desired tracking-event and consent-record
  lifetime; the free-MVP default is 30 days.
- Schedule `npm run db:cleanup:events --workspace @ai-growth/api` from the
  repository root. The cleanup command is repeatable and removes expired
  tracking events and consent records.
- Platform administrators move privacy requests to `PROCESSING`. Run
  `npm run privacy:process --workspace @ai-growth/api` to complete queued
  requests. A completed `DELETE` request removes tracking, consent, insight,
  and funnel data for the organization; account, billing, and audit records
  remain for separate policy review.
- Consent-gated sites must use the SDK consent API. The tracker supports
  opt-out and Do Not Track, and the collector masks sensitive properties.
- Review `PRIVACY.md` with legal counsel before public launch. GDPR, CCPA, and
  India DPDP obligations depend on the operator, users, processing purposes,
  and jurisdictions involved.

## Provisioning order

1. Create or select the free Neon PostgreSQL database.
2. Store the environment values in the deployment platform’s secret manager; do not commit `.env` files.
3. Run the free-MVP environment validator, then deploy Prisma migrations.
4. Deploy the API and confirm `/health`, `/health/db`, and `/ready`.
5. Deploy the dashboard, set its public API URL, and update API `CORS_ORIGINS`.
6. Verify `/tracker.js` and a real test event before accepting traffic.

The repeatable local/free-stack smoke check sends representative page, click,
form, and conversion events and confirms they are stored in PostgreSQL:

```bash
POSTGRES_EVENT_STORAGE_ENABLED=true npm run smoke:free --workspace @ai-growth/api
```

Set `API_BASE_URL`, `DASHBOARD_URL`, `TRACKING_ID`, and `TRACKING_ORIGIN` when
testing a deployed stack. The smoke check creates clearly labelled test events
and does not delete them automatically.

Record free-tier usage and scale signals with:

```bash
npm run report:free --workspace @ai-growth/api
```

The report prints API health latency, database/table size, event counts,
retention coverage, and configured free-MVP limits. It does not change
application or database data.
