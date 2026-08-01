# Production observability and reliability

Phase 19 establishes a free-MVP operational baseline. It intentionally uses the API’s structured stdout logs, bounded in-memory request metrics, Neon’s free PostgreSQL controls, and deployment-provider health checks. No paid monitoring service is required.

## Service targets

- Availability target: 99% monthly for the API, excluding provider outages and planned maintenance.
- API error target: less than 1% HTTP 5xx responses over a rolling 24-hour window.
- API latency target: p95 below 500 ms for normal API requests; database wake-up latency on free tiers is tracked separately.
- Tracking acceptance target: collector 5xx rate below 1%; HTTP 429 responses indicate traffic exceeded the per-IP/tracking-ID protection.

These are initial operating targets, not a customer SLA.

## Health and metrics

- `GET /health` checks process availability.
- `GET /health/db` checks PostgreSQL connectivity.
- `GET /ready` checks database readiness and the optional event pipeline state.
- `GET /health/pipeline` exposes event-pipeline counters without payload data.
- `GET /health/metrics` exposes bounded request count, 5xx/429 counts, error rate, uptime, and p50/p95/max latency.

The API emits one JSON request log per completed request. Logs contain method, path, status, duration, request ID, and IP; request bodies, authorization headers, and query strings are excluded.

## Alert thresholds

Configure alerts in the deployment provider using these initial thresholds:

| Signal | Warning | Critical | Response |
| --- | ---: | ---: | --- |
| `/health` failure | 2 checks | 5 minutes | Inspect deploy and provider status; rollback if the latest release caused it. |
| HTTP 5xx rate | >1% / 15 min | >5% / 5 min | Inspect logs, database health, and recent deployment. |
| API p95 latency | >500 ms / 15 min | >2 s / 5 min | Check Neon wake-up, query latency, and traffic volume. |
| Database readiness | 1 failure | 3 consecutive failures | Check Neon status, connection string, and migration state. |
| Collector 429 rate | >2% / 15 min | >10% / 5 min | Check traffic quality and adjust limits only after abuse review. |

## Free-stack backup and restore drill

Neon is the source of truth for the MVP database. Before a launch or schema-risky change:

1. Confirm Neon backup/branch availability and record the current migration name.
2. Create a disposable Neon branch or restore point; never test a restore over production.
3. Apply the repository migrations with `npm run db:migrate:deploy --workspace @ai-growth/api`.
4. Run `npm run db:status --workspace @ai-growth/api` and verify `/health/db` and `/ready`.
5. Compare representative counts for organizations, websites, tracking events, and privacy requests.
6. Record the drill date, restore point, migration state, and verification result in the deployment ticket.

The restore drill is deliberately manual on the free plan. It must be completed before public launch and after any material schema change.

## Rollback runbook

1. Confirm the incident through `/health`, `/health/db`, `/ready`, and deployment logs.
2. If the current release caused the failure, use the provider’s previous successful deploy or redeploy the last known-good commit.
3. Do not run `prisma migrate reset` in production. Forward-only migrations require a compatible application rollback or a reviewed database migration.
4. If a migration is incompatible, stop writes, restore a disposable branch first, and coordinate a reviewed forward fix.
5. Recheck health, authentication, tracking collection, and dashboard login before reopening traffic.
6. Record impact, timeline, root cause, mitigation, and follow-up actions.

## Load and rate-limit checks

With the API running locally or in a controlled environment:

```bash
API_BASE_URL=http://localhost:4000 LOAD_TEST_REQUESTS=100 LOAD_TEST_CONCURRENCY=10 \
  npm run load:test:health --workspace @ai-growth/api
```

This only exercises `/health`, does not write data, and is capped at 5,000 requests. Collector and authentication rate limits should be tested separately with synthetic identifiers and explicit approval; do not load test a customer website or production endpoint without permission.

## Incident ownership

Until a formal on-call rotation exists, the repository owner is the incident owner. Deployment logs, `/health/metrics`, `/health/pipeline`, Neon status, and the latest git commit are the first evidence sources. Review this runbook after each incident and before private beta.
