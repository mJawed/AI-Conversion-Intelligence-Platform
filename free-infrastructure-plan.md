# Free Infrastructure Plan

## Objective

Run the AI Growth MVP at zero infrastructure cost by using the existing Neon
PostgreSQL database and removing dependencies on paid or trial-based services.

This plan is for development, demos, and low-volume private beta usage. Free
tiers have limits, sleep behavior, quotas, and policy restrictions that must be
reviewed before commercial production use.

## Recommended free architecture

```text
Live website
      ↓
Public API hosting
      ↓
Neon PostgreSQL
      ↓
Dashboard hosting
```

### Services

- PostgreSQL: existing Neon Free database.
- API hosting: a free web-service host such as Render Free for early testing.
- Dashboard hosting: the same host's free static/web service or another free
  static host.
- Event processing: direct PostgreSQL writes or a small in-process queue.
- Rate limiting: PostgreSQL-backed counters initially; memory-only limits are
  acceptable for local development.
- Analytics: PostgreSQL aggregate queries and indexed event tables.
- Email: postpone email delivery; use in-app status and manual verification.
- File storage: postpone replay recordings and exports larger than JSON.

RabbitMQ, Redis, and ClickHouse are removed from the free MVP path. They can be
reintroduced later behind interfaces if traffic requires them.

## Important free-tier limitations

- Free API hosting may sleep when idle, causing slow first requests and delayed
  tracking verification.
- PostgreSQL storage, compute, connections, and transfer remain limited.
- PostgreSQL analytics will not scale like ClickHouse for high-volume event
  traffic.
- Free hosting is suitable for testing and a private beta, not a guaranteed
  production SLA.
- We must monitor quotas and avoid enabling automatic paid upgrades.

## Phase 1 — Free architecture and configuration

**Status:** Complete as a configuration foundation

- Add a feature flag for PostgreSQL analytics persistence.
- Make RabbitMQ, Redis, and ClickHouse optional rather than required.
- Add free-MVP environment examples and safe disabled defaults.
- Define event retention and maximum event volume for the free tier.

### Delivered

- Added `FREE_MVP_MODE` with safe free-mode defaults.
- Added `ANALYTICS_STORAGE`, PostgreSQL event-storage, retention, and daily
  event-volume configuration.
- Exposed the active infrastructure mode through API health metadata.
- Made production environment validation skip external queue/cache/analytics
  requirements in explicit free-MVP mode.
- Added bounded configuration defaults and unit coverage.

## Phase 2 — PostgreSQL event storage

**Status:** Complete

- Add a Prisma `TrackingEvent` model for privacy-safe event data.
- Add indexes for website, occurred time, session, visitor, and event type.
- Persist accepted collector events directly when the free pipeline is enabled.
- Preserve duplicate protection and organization/website isolation.
- Add retention-safe cleanup commands.

### Delivered

- Added the PostgreSQL `tracking_events` table and tenant-safe indexes through a
  Prisma migration.
- Persisted accepted collector events when
  `POSTGRES_EVENT_STORAGE_ENABLED=true`; free mode remains safe when disabled.
- Preserved website ownership, event deduplication, and privacy masking before
  persistence.
- Added `db:cleanup:events` with bounded retention configuration.
- Verified an end-to-end conversion event was stored in the Neon database.

## Phase 3 — PostgreSQL analytics queries

**Status:** Complete

- Replace ClickHouse-only analytics queries with PostgreSQL equivalents.
- Preserve overview, visitors, sessions, forms, behaviour, heatmaps, replays,
  and insights API contracts.
- Use bounded date ranges, pagination, and aggregate limits.
- Return clear unavailable states when a feature needs unsupported storage.

### Delivered

- Replaced ClickHouse-only analytics reads with bounded PostgreSQL queries.
- Preserved overview, visitors, sessions, forms, behaviour, heatmaps, replays,
  and insights response contracts.
- Added PostgreSQL date filtering, pagination, distinct visitor/session counts,
  latest-page selection, form-property aggregation, and daily traffic totals.
- Added a clear `ANALYTICS_UNAVAILABLE` response when PostgreSQL queries fail.
- Kept coordinate-level heatmap limitations explicit because the tracker does
  not yet collect click coordinates.

## Phase 4 — Free hosting readiness

**Status:** Complete

- Add a free-host deployment configuration for the API.
- Add a free-host deployment configuration for the dashboard.
- Configure public API URL, dashboard origin, database URL, and JWT secrets.
- Confirm the API can serve `/tracker.js` publicly.
- Add health and readiness checks that work after service sleep/wake.

### Delivered

- Added a Render Blueprint for free API and dashboard web services.
- Added production API emit/start scripts and support for the platform `PORT`.
- Added non-interactive Prisma migration execution before API startup.
- Configured free-mode environment values with PostgreSQL storage and the
  external event pipeline disabled.
- Documented public API URL, dashboard origin, secret configuration, health
  checks, sleep/wake behavior, and tracker verification.

## Phase 5 — Free MVP end-to-end testing

**Status:** Complete

- Install the tracker on a real test website.
- Verify page views, clicks, forms, scrolls, and conversions.
- Confirm events appear in PostgreSQL and the dashboard.
- Test API wake-up delays and retry behavior.
- Check free-tier quotas and disable any automatic paid upgrades.

### Delivered

- Added the repeatable `smoke:free` check for the API, tracker, dashboard, and
  Neon event persistence path.
- Covered representative page, click, form-start, form-submit, and conversion
  events with a real tracking ID and allowed website origin.
- Confirmed free-mode health/readiness and PostgreSQL storage configuration.
- Documented deployed-stack smoke-test variables and free-tier limitations.

## Phase 6 — Cost and scale decision

**Status:** Complete

- Record monthly event volume, database size, API requests, and response time.
- Keep PostgreSQL-only architecture if performance is acceptable.
- Add Redis only if distributed rate limiting or active sessions require it.
- Add a queue only if event ingestion cannot remain reliable inline.
- Add ClickHouse only when PostgreSQL analytics becomes the measured bottleneck.

### Delivered

- Added the read-only `report:free` usage and scale report.
- Measured current API health latency, database size, event-table size, event
  volume, retention coverage, and website count against Neon.
- Kept the PostgreSQL-only architecture based on the current low-volume
  baseline.
- Documented measurable triggers for distributed rate limiting, queues, and
  ClickHouse rather than introducing paid infrastructure preemptively.

### Current baseline

- 11 stored events across 5 websites.
- 8.6 MB database size and 114 KB tracking-event table size.
- 11 events within the 30-day retention window.
- First database health check measured approximately 3.46 seconds, showing
  free-tier wake-up latency; this is an expected limitation to monitor.

## Definition of free MVP completion

- No required service has a paid-only dependency.
- API, dashboard, database, and tracker work within free-tier limits.
- No automatic billing upgrade is enabled.
- Analytics data is stored and queried from PostgreSQL.
- Limitations are visible to the user and documented.

## Official pricing references

- [Neon pricing](https://neon.com/pricing)
- [Render free services](https://render.com/docs/free)
- [Upstash Redis pricing](https://upstash.com/pricing/redis)
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
