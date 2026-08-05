# Execution Notes

## Phase 1 — Dashboard Foundation

**Status:** Complete

**Executed:** 2026-07-31

### Completed

- Refactored the dashboard into a reusable `DashboardShell`.
- Added reusable page header, empty state, button, loading state, and error state components.
- Added typed navigation and overview metric mock data.
- Added navigation links for Overview, Visitors, Funnels, Forms, and AI Insights.
- Added responsive sidebar behavior for smaller screens.
- Added keyboard focus states for navigation and controls.
- Preserved the website connection onboarding state.
- Kept mock data isolated from page presentation so it can later be replaced by API services.

### Files Added

- `apps/dashboard/app/components/dashboard-shell.tsx`
- `apps/dashboard/app/components/ui.tsx`
- `apps/dashboard/app/data/mock.ts`

### Files Updated

- `apps/dashboard/app/page.tsx`
- `apps/dashboard/app/styles.css`

### Verification

- Dashboard TypeScript check: passed
- Dashboard production build: passed

## Remaining Plan Phase 17 — AI insight generation

**Status:** Complete as a free, evidence-backed insight foundation

### Completed

- Added persisted insight records with lifecycle status.
- Added deterministic PostgreSQL insight generation from conversion, form, and
  interaction signals.
- Added evidence-backed CRO fields: problem, reason, confidence, business
  impact, recommendation, priority, and expected improvement.
- Added protected resolve and dismiss actions with audit logging.
- Connected the live insights dashboard to generated findings and lifecycle
  updates.

### Verification

- Prisma migration/database status: passed
- API typecheck/build: passed
- API unit tests: passed (14/14)
- Dashboard production build: passed
- Static page generation: passed

Next.js reported a non-blocking warning that it could not patch missing SWC lockfile dependencies because registry DNS was unavailable. The application still compiled and the dashboard page was generated successfully.

### Not Included

- Real API calls
- Authentication
- Website creation flow
- Live analytics data
- Functional date range filtering

These belong to later phases or backend integration.

## Phase 2 — Overview Dashboard

**Status:** Complete

**Executed:** 2026-07-31

### Completed

- Replaced the Phase 1 empty overview with realistic typed mock data.
- Added six overview metrics: visitors, sessions, conversion rate, average session, bounce rate, and live visitors.
- Added positive metric change indicators.
- Added website selector and date range control placeholders.
- Added visitor trend chart with a lightweight inline SVG visualization.
- Added realtime active visitor summary with current page breakdown.
- Added top pages content widget.
- Added recent AI insights preview with priority and estimated impact.
- Added a secondary website connection reminder.

### Files Added

- `apps/dashboard/app/components/overview-widgets.tsx`

### Files Updated

- `apps/dashboard/app/data/mock.ts`
- `apps/dashboard/app/page.tsx`
- `apps/dashboard/app/styles.css`

### Verification

- Dashboard TypeScript check: passed
- Dashboard production build: passed
- Static page generation: passed

The first build attempt was blocked by insufficient disk space while Next.js generated `.next`. The generated cache was cleared and the build passed on the second attempt.

### Not Included

- Functional website switching
- Functional date range filtering
- Live API data
- Realtime WebSocket data
- Chart interaction

These will be added during API integration and later analytics phases.

## Phase 3 — Visitor Analytics

**Status:** Complete

**Executed:** 2026-07-31

### Completed

- Added the `/visitors` route to the dashboard.
- Added a typed visitor and session mock data model.
- Added visitor search across names, pages, countries, and traffic sources.
- Added status filters for active, converted, returned, and bounced visitors.
- Added sorting by recent activity, engagement events, and session duration.
- Added selectable visitor list rows with active selection state.
- Added visitor detail panel with current page, last seen, and session count.
- Added device, country, browser, traffic source, and scroll depth signals.
- Added session timeline with navigation, form, engagement, and conversion events.
- Added session replay action placeholder.
- Added responsive mobile layout for the visitor list and detail view.
- Updated sidebar active navigation state to support nested dashboard routes.

### Files Added

- `apps/dashboard/app/visitors/page.tsx`
- `apps/dashboard/app/visitors/visitors-view.tsx`

### Files Updated

- `apps/dashboard/app/data/mock.ts`
- `apps/dashboard/app/components/dashboard-shell.tsx`
- `apps/dashboard/app/styles.css`

### Verification

- Dashboard TypeScript check: passed
- Dashboard production build: passed
- Static page generation: passed for `/` and `/visitors`

### Not Included

- Real visitor API data
- Server-side pagination
- Persistent filters in the URL
- Real session replay playback
- Visitor identity resolution

These will be added during backend and session replay integration.

## Phase 4 — Forms Intelligence

**Status:** Complete

**Executed:** 2026-07-31

### Completed

- Added the `/forms` route to the dashboard.
- Added three tracked form mock profiles with selectable tabs.
- Added started, completed, completion rate, abandonment, and average completion time metrics.
- Added field-level completion and drop-off analysis.
- Added validation error counts and friction signals.
- Added completion-time bar visualization.
- Added form-specific CRO recommendation panels with priority and estimated impact.
- Added responsive layouts for summary cards, field tables, and recommendation panels.
- Updated active navigation behavior for the Forms route.

### Files Added

- `apps/dashboard/app/forms/page.tsx`
- `apps/dashboard/app/forms/forms-view.tsx`

### Files Updated

- `apps/dashboard/app/data/mock.ts`
- `apps/dashboard/app/styles.css`

### Verification

- Dashboard TypeScript check: passed
- Dashboard production build: passed
- Static page generation: passed for `/`, `/visitors`, and `/forms`

The build completed with non-blocking Autoprefixer warnings related to the compact CSS layout rules.

### Not Included

- Real form event ingestion
- Field-level API data
- Form selector configuration
- Real validation error capture
- AI-generated recommendations from live evidence

These will be added during event pipeline and AI integration.

## Phase 5 — Funnel Analytics

**Status:** Complete

**Executed:** 2026-07-31

### Completed

- Added the `/funnels` route to the dashboard.
- Added three selectable funnel mock profiles: purchase, demo request, and newsletter signup.
- Added total visitors, conversions, conversion rate, and period change metrics.
- Added visual funnel step progression with visitor counts and conversion percentages.
- Added step-level drop-off rates and bottleneck indicators.
- Added AI explanation panel with reason, confidence, recommendation, and expected impact.
- Added segment performance comparison placeholder for mobile and desktop.
- Added largest drop-off prioritization summary.
- Added responsive layouts for funnel summaries, step visualizations, and comparison panels.
- Updated active navigation behavior for the Funnels route.

### Files Added

- `apps/dashboard/app/funnels/page.tsx`
- `apps/dashboard/app/funnels/funnels-view.tsx`

### Files Updated

- `apps/dashboard/app/data/mock.ts`
- `apps/dashboard/app/styles.css`

### Verification

- Dashboard TypeScript check: passed
- Dashboard production build: passed
- Static page generation: passed for `/`, `/visitors`, `/forms`, and `/funnels`

The build completed with the existing non-blocking Autoprefixer warnings from the compact CSS layout rules.

### Not Included

- User-defined funnel creation
- Live funnel event aggregation
- Real segment comparison queries
- Funnel date filtering
- Export functionality

These will be added during API integration and analytics pipeline work.

## Phase 6 — Behaviour Analytics

**Status:** Complete

**Executed:** 2026-07-31

### Completed

- Added the `/behavior` route to the dashboard.
- Added page filtering for all pages, homepage, pricing, features, and blog content.
- Added total clicks, average scroll depth, rage clicks, and dead clicks metrics.
- Added top clicked element analytics with selectors, click counts, rates, and CTA issue flags.
- Added scroll-depth comparison by page.
- Added rage-click, dead-click, scroll drop-off, and exit-pattern issue cards.
- Added landing-page and exit-page journey summaries.
- Added UX issue impact indicators and priority badges.
- Added responsive layouts for behaviour widgets and mobile filter controls.
- Added Behaviour to the primary dashboard navigation.

### Files Added

- `apps/dashboard/app/behavior/page.tsx`
- `apps/dashboard/app/behavior/behavior-view.tsx`

### Files Updated

- `apps/dashboard/app/data/mock.ts`
- `apps/dashboard/app/components/dashboard-shell.tsx`
- `apps/dashboard/app/styles.css`

### Verification

- Dashboard TypeScript check: passed
- Dashboard production build: passed
- Static page generation: passed for `/`, `/visitors`, `/forms`, `/funnels`, and `/behavior`

The build completed with the existing non-blocking Autoprefixer warnings from the compact CSS layout rules.

### Not Included

- Real click and scroll event ingestion
- DOM coordinate heatmap rendering
- Automated rage/dead-click classification
- Page-level event filtering from the API
- Live UX issue generation

These will be added during event pipeline, heatmap, and AI integration.

## Phase 7 — Heatmaps and Session Replay

**Status:** Complete

**Executed:** 2026-07-31

### Completed

- Added `/heatmaps` for visual click, scroll-depth, and dead-click analysis.
- Added heatmap mode tabs and page selector controls.
- Added a page preview stage with click-density and dead-click markers.
- Added heatmap legend, attention metrics, and AI summary action placeholder.
- Added `/replays` for session replay exploration.
- Added replay session list with selected-session state.
- Added replay player placeholder with progress controls.
- Added session status categories: converted, frustrated, and exploring.
- Added AI session summary cards.
- Added replay timelines with navigation, frustration, and conversion events.
- Added responsive layouts for heatmap previews and replay details.
- Added Heatmaps and Replays to the primary dashboard navigation.

### Files Added

- `apps/dashboard/app/heatmaps/page.tsx`
- `apps/dashboard/app/heatmaps/heatmaps-view.tsx`
- `apps/dashboard/app/replays/page.tsx`
- `apps/dashboard/app/replays/replays-view.tsx`

### Files Updated

- `apps/dashboard/app/data/mock.ts`
- `apps/dashboard/app/styles.css`

### Verification

- Dashboard TypeScript check: passed

Production build was not run because the dashboard development server was active; rebuilding `.next` while it is running can invalidate its development chunks.

### Not Included

- Real heatmap coordinate data
- DOM-aware heatmap rendering
- Real session replay capture and playback
- Replay scrubbing or playback controls
- Screenshot and privacy masking pipeline
- AI summaries generated from live sessions

These will be added during tracker, storage, privacy, and AI integration.

## Phase 8 — AI Insights Centre

**Status:** Complete

**Executed:** 2026-07-31

### Completed

- Added the `/insights` route to the dashboard.
- Added five typed CRO insights across Forms, UX, CTA, Content, and Funnels.
- Added severity filters for High, Medium, and Low priorities.
- Added category filters for each insight type.
- Added prioritized insight list with status labels.
- Added selectable insight detail view.
- Added problem, reason, evidence, confidence, business impact, and recommendation fields.
- Added expected conversion improvement for each recommendation.
- Added status action placeholders for resolving and dismissing insights.
- Added responsive layouts for the insight list and detail view.

### Files Added

- `apps/dashboard/app/insights/page.tsx`
- `apps/dashboard/app/insights/insights-view.tsx`

### Files Updated

- `apps/dashboard/app/data/mock.ts`
- `apps/dashboard/app/styles.css`

### Verification

- Dashboard TypeScript check: passed

Production build was not run because the dashboard development server was active; rebuilding `.next` while it is running can invalidate development chunks.

### Not Included

- Live AI model calls
- Insight persistence and status updates
- Evidence computed from live analytics
- Recommendation tracking
- Insight report generation

These will be added during API, AI engine, and persistence integration.

## Phase 9 — Settings and Website Onboarding

**Status:** Complete

**Executed:** 2026-07-31

### Completed

- Added `/settings` with Website, Installation, Team, and Billing tabs.
- Added website name, domain, industry, timezone, currency, and status views.
- Added tracking ID display and copy action placeholder.
- Added tracking script installation instructions with verification action.
- Added team access panel with owner and pending invite examples.
- Added organization permissions guidance.
- Added subscription plan, monthly event usage, invoice, and billing action placeholders.
- Added `/onboarding` first-website setup screen.
- Added onboarding progress indicator and website name/URL fields.
- Added responsive layouts for settings panels and onboarding.
- Added Settings to the primary dashboard navigation.

### Files Added

- `apps/dashboard/app/settings/page.tsx`
- `apps/dashboard/app/settings/settings-view.tsx`
- `apps/dashboard/app/onboarding/page.tsx`

### Files Updated

- `apps/dashboard/app/data/mock.ts`
- `apps/dashboard/app/styles.css`

### Verification

- Dashboard TypeScript check: passed

Production build was not run because the dashboard development server was active; rebuilding `.next` while it is running can invalidate development chunks.

### Not Included

- Persisted website settings
- Real tracking ID generation
- Script verification requests
- Authentication and organization permissions
- Stripe billing integration
- Functional onboarding submission

These will be added during backend, authentication, and billing integration.

## Phase 10 — API Integration Layer

**Status:** Complete — integration foundation

**Executed:** 2026-07-31

### Completed

- Added a typed API client with shared request handling.
- Added `ApiError` with status-aware error messages.
- Added API health checking from the dashboard.
- Added visible API connection status to the dashboard header.
- Added generic analytics GET and POST client methods.
- Added centralized data-source adapters for website settings, forms, funnels, and insights.
- Added environment-controlled mock fallback with `NEXT_PUBLIC_USE_MOCK_DATA=true` by default.
- Added API query-string support for future date ranges, pagination, and filters.
- Documented how to switch from mock data to live API resources.

### Files Added

- `apps/dashboard/app/lib/api-client.ts`
- `apps/dashboard/app/lib/data-source.ts`
- `apps/dashboard/app/components/api-status.tsx`

### Files Updated

- `apps/dashboard/app/components/dashboard-shell.tsx`
- `.env.example`
- `README.md`

### Verification

- Dashboard TypeScript check: passed
- API TypeScript check: passed

### Current Integration Boundary

The Express API currently exposes health and version endpoints only. The dashboard therefore remains mock-backed by default. Setting `NEXT_PUBLIC_USE_MOCK_DATA=false` prepares the client for `/api/v1/analytics/*` resources, but those live analytics endpoints still need to be implemented in the backend.

### Not Included

- Authentication state
- Live organization and website endpoints
- Live analytics queries
- Server-side pagination implementation
- WebSocket or realtime transport
- API request caching and retry policy

These are the next backend integration tasks.

## Backend Phase 1 — PostgreSQL and Prisma Migration

**Status:** Complete

**Executed:** 2026-07-31

### Completed

- Connected Prisma to the hosted Neon PostgreSQL database.
- Applied migration `20260731105220_init`.
- Confirmed the database is synchronized with the Prisma schema.
- Added `/health/db` to verify live database connectivity.
- Added an idempotent development seed script.
- Added seed records for a demo owner, organization, membership, and website.
- Added `db:seed` and database health documentation.

### Files Added

- `prisma/seed.ts`

### Files Updated

- `apps/api/src/server.ts`
- `apps/api/package.json`
- `README.md`

### Verification

- Prisma migration against Neon: passed
- API TypeScript check: passed
- Prisma schema validation: passed

To complete local seed and health verification with the configured Neon environment:

```bash
npm run db:seed --workspace @ai-growth/api
npm run dev --workspace @ai-growth/api
curl http://localhost:4000/health/db
```

### Not Included

- Authentication
- Password hashing
- Protected routes
- Organization authorization

Those belong to Backend Phase 2.

## Backend Phase 2 — Authentication

**Status:** Complete

**Executed:** 2026-07-31

### Completed

- Added refresh-token persistence with expiry and revocation fields.
- Added bcrypt password hashing.
- Added JWT access-token generation.
- Added refresh-token rotation.
- Added user registration with automatic organization and owner membership creation.
- Added login and invalid-credential handling.
- Added refresh and logout endpoints.
- Added current-user endpoint.
- Added bearer-token authentication middleware.
- Added request validation with Zod.
- Added API and environment configuration for JWT secrets and token lifetimes.

### Files Added

- `apps/api/src/auth.ts`
- `apps/api/src/auth-routes.ts`
- `apps/api/src/types/bcryptjs.d.ts`

### Files Updated

- `prisma/schema.prisma`
- `apps/api/src/server.ts`
- `apps/api/package.json`
- `.env.example`

### Verification

- Prisma Client generation: passed
- API TypeScript check: passed
- Registration smoke test: passed
- Protected `/api/v1/auth/me` flow: ready for local token verification

### Verification Commands

Run against the configured Neon database:

```bash
npm run db:generate --workspace @ai-growth/api
npm run db:migrate:auth --workspace @ai-growth/api
npm run db:seed --workspace @ai-growth/api
```

Add a strong `JWT_SECRET` to `.env` before starting the API.

### API Endpoints

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

## Backend Phase 3 — Organizations and permissions

**Status:** Complete

### Completed

- Added authenticated organization listing.
- Added organization membership and active-status authorization middleware.
- Added organization detail and member-list endpoints.
- Added owner/admin role updates with role escalation safeguards.
- Restricted inactive organizations and non-members from organization resources.
- Kept owner transfer as an explicit future workflow.

### API Endpoints

```text
GET   /api/v1/organizations
GET   /api/v1/organizations/:organizationId
GET   /api/v1/organizations/:organizationId/members
PATCH /api/v1/organizations/:organizationId/members/:userId
```

### Verification

```bash
curl http://localhost:4000/api/v1/organizations \\
  -H "Authorization: Bearer ACCESS_TOKEN"

curl http://localhost:4000/api/v1/organizations/ORGANIZATION_ID/members \\
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Verification results on a fresh API instance:

- Registration automatically created an owner organization: passed
- Authenticated organization listing: passed (`200`)
- Organization detail endpoint: passed (`200`)
- Organization members endpoint: passed (`200`)
- Unauthenticated organization access: passed (`401`)

## Backend Phase 4 — Website management

**Status:** Complete

### Completed

- Added organization-scoped website creation with generated unique tracking IDs.
- Added website listing and detail endpoints.
- Added validated website settings updates for name, domain, timezone, currency, and industry.
- Added pause and archive lifecycle endpoints.
- Added deletion safeguards: websites must be archived before deletion.
- Restricted website mutations by organization role.
- Normalized and validated website domains before persistence.
- Ensured website lookups always include both organization and website identifiers.

### API Endpoints

```text
GET    /api/v1/organizations/:organizationId/websites
POST   /api/v1/organizations/:organizationId/websites
GET    /api/v1/organizations/:organizationId/websites/:websiteId
PATCH  /api/v1/organizations/:organizationId/websites/:websiteId
POST   /api/v1/organizations/:organizationId/websites/:websiteId/pause
POST   /api/v1/organizations/:organizationId/websites/:websiteId/archive
DELETE /api/v1/organizations/:organizationId/websites/:websiteId
```

### Verification

- API TypeScript check: passed
- Website creation: passed (`201`)
- Website listing: passed (`200`)
- Website update: passed (`200`)
- Delete-before-archive safeguard: passed (`409`)
- Website pause: passed (`200`)
- Website archive: passed (`200`)
- Archived website deletion: passed (`204`)

## Backend Phase 5 — Tracking installation and verification

**Status:** Complete

### Completed

- Added persistent tracking installation status to websites.
- Added first-event, last-event, and verification timestamps.
- Added tracking-script configuration endpoint with a ready-to-install snippet.
- Added domain-aware tracking verification.
- Added a `recordTrackingEvent` service hook for the future public event collector.
- Added verification rate limiting: five attempts per ten-minute window per user, organization, and website.
- Added tracking script URL configuration through `TRACKING_SCRIPT_URL`.

### API Endpoints

```text
GET  /api/v1/organizations/:organizationId/websites/:websiteId/tracking-script
POST /api/v1/organizations/:organizationId/websites/:websiteId/verify
```

### Verification

- Tracking migration applied to Neon: passed
- API and dashboard typechecks: passed
- Tracking script configuration: passed (`200`)
- No-event verification state: passed (`202`)
- Domain mismatch validation: passed (`400`)
- Verification rate limit: passed (`429`)

The public event ingestion endpoint remains part of Backend Phase 7. Once it receives a valid event, it will call `recordTrackingEvent` and transition the website to `VERIFIED`.

## Backend Phase 6 — Frontend API integration

**Status:** Complete

### Completed

- Added browser session state with access-token storage and refresh-token rotation.
- Added live login flow at `/login`.
- Added authenticated current-user and organization loading.
- Added organization and website selectors for live mode.
- Added live website settings loading and updates.
- Added live tracking-script and connection-verification actions in Settings.
- Added loading, retry, error, empty, and signed-out states.
- Preserved mock mode as the default for analytics screens while live analytics endpoints are built.

### Configuration

```bash
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Start the API and dashboard, then open `/login`. The dashboard can use the seeded owner account or any account created through the authentication API.

### Verification

- Dashboard TypeScript check: passed
- API TypeScript check: passed
- API contract types for authentication, organizations, websites, tracking configuration, and verification: passed

## Backend Phase 7 — Public tracking event collector

**Status:** Complete

### Completed

- Added public `POST /api/v1/collect` event ingestion.
- Added tracking-ID lookup and active-website validation.
- Added Zod payload validation for page views, sessions, forms, conversions, clicks, scrolls, and custom events.
- Added 32 KB JSON request-body limit.
- Added origin checks against the configured website domain.
- Added process-local rate limiting per tracking ID and client IP.
- Added 24-hour process-local duplicate event protection by tracking ID and event ID.
- Added recursive masking for sensitive properties and removed URL query strings before the event leaves the collector.
- Added first-event recording through the website installation state hook.
- Rejected paused and archived website tracking requests.

### API Endpoint

```text
POST /api/v1/collect
```

Required event fields:

```json
{
  "trackingId": "trk_example",
  "eventId": "evt_12345678",
  "eventType": "page_view",
  "visitorId": "visitor_123",
  "sessionId": "session_123",
  "url": "https://example.com/pricing"
}
```

### Verification

- API TypeScript check: passed
- Valid event accepted and first event detected: passed (`202`)
- Sensitive property masking and URL query removal: passed
- Duplicate event response: passed
- Invalid tracking ID rejection: passed (`401`)
- Disallowed origin rejection: passed (`403`)
- Rate-limit logic implemented with `429` response and `Retry-After`

Durable event storage, queue delivery, and distributed rate limiting remain part of Backend Phase 8.

## Backend Phase 8 — Queue and event persistence

**Status:** Complete as an integration foundation; external services disabled by default

### Completed

- Added RabbitMQ publisher and consumer topology with durable process, retry, and dead-letter queues.
- Added persistent delivery mode and retry headers with three processing attempts.
- Added Redis active-session adapter with a 30-minute session TTL.
- Added ClickHouse HTTP JSONEachRow persistence adapter.
- Added ClickHouse table definition at `apps/api/sql/events.sql`.
- Added event-pipeline metrics at `GET /health/pipeline`.
- Added graceful API shutdown for RabbitMQ, Redis, and Prisma resources.
- Connected the public collector to the pipeline publisher when enabled.
- Kept the pipeline disabled by default so development can continue without Docker services.

### Configuration

```env
EVENT_PIPELINE_ENABLED=false
REDIS_ENABLED=false
CLICKHOUSE_ENABLED=false
RABBITMQ_URL=amqp://growth:growth@localhost:5672
REDIS_URL=redis://localhost:6379
CLICKHOUSE_URL=http://localhost:8123
```

Enable the pipeline only after RabbitMQ is available. Enable Redis and ClickHouse after their schema/service checks are complete. Apply `apps/api/sql/events.sql` to ClickHouse before enabling `CLICKHOUSE_ENABLED`.

### Verification

- API and dashboard typechecks: passed
- API health with pipeline disabled: passed
- Pipeline health endpoint: passed (`200`)
- Disabled-mode metrics report: passed

The next phase is Backend Phase 9, which builds analytics APIs over the persisted event data.

## Backend Phase 9 — Analytics APIs

**Status:** Complete as a tenant-scoped analytics API foundation

### Completed

- Added authenticated, organization-scoped analytics context validation.
- Added ClickHouse query adapter with parameterized website/date filters.
- Added overview metrics, top pages, and traffic trend queries.
- Added visitor and session endpoints with pagination.
- Added forms analytics endpoint using form event properties.
- Added funnel endpoint contract with an explicit empty state until funnel definitions exist.
- Added behaviour, heatmap, replay, and AI insight endpoint contracts.
- Added `behavior` alias alongside the documented `behaviour` route.
- Added date range, limit, offset, and sort query contract validation.
- Added consistent unauthorized, invalid-query, unavailable, and tenant-scope errors.

### API Endpoints

```text
GET /api/v1/analytics/overview
GET /api/v1/analytics/visitors
GET /api/v1/analytics/sessions
GET /api/v1/analytics/forms
GET /api/v1/analytics/funnels
GET /api/v1/analytics/behaviour
GET /api/v1/analytics/heatmaps
GET /api/v1/analytics/replays
GET /api/v1/analytics/insights
```

Required context query parameters:

```text
organizationId=<organization UUID>
websiteId=<website UUID>
```

Optional parameters include `from`, `to`, `limit`, `offset`, and `sort`.

### Verification

- API and dashboard typechecks: passed
- Unauthenticated request rejection: passed (`401`)
- Invalid analytics query rejection: passed (`400`)
- Authorized request with ClickHouse disabled: passed (`503`)
- Pipeline health endpoint remained available: passed (`200`)

The dashboard analytics screens still use mock data until ClickHouse is enabled and the frontend resource adapters are connected to these endpoints.

## Backend Phase 10 — Security and compliance

**Status:** Complete as a security/compliance foundation

### Completed

- Added Helmet security headers.
- Added allowlisted application CORS with a separate public collector CORS path.
- Added request logging that records method, path, status, duration, IP, and request ID without request bodies, authorization headers, or event payloads.
- Added authentication throttling for registration and login.
- Added AES-256-GCM encrypted API-key storage.
- Added owner/admin API-key create, list, and revoke endpoints.
- Added audit-log persistence and organization audit-log endpoint.
- Added privacy export endpoint with sensitive credential fields excluded.
- Added export and deletion request workflow with audit records.
- Added Prisma models and migration for API keys, audit logs, and privacy requests.

### Configuration

```env
CORS_ORIGINS=http://localhost:3000
ENCRYPTION_KEY=<64 hexadecimal characters generated from a secure secret>
```

Generate a development encryption key with:

```bash
openssl rand -hex 32
```

### API Endpoints

```text
GET    /api/v1/organizations/:organizationId/api-keys
POST   /api/v1/organizations/:organizationId/api-keys
DELETE /api/v1/organizations/:organizationId/api-keys/:apiKeyId
GET    /api/v1/organizations/:organizationId/audit-logs
GET    /api/v1/privacy/export?organizationId=<id>
GET    /api/v1/privacy/requests?organizationId=<id>
POST   /api/v1/privacy/requests
```

### Verification

- Security migration applied to Neon: passed
- API and dashboard typechecks: passed
- Helmet header: passed
- Allowlisted CORS header: passed
- API-key creation: passed (`201`)
- API-key list excludes secret and ciphertext: passed
- Privacy export: passed (`200`)
- Privacy deletion request: passed (`202`)
- Audit-log access: passed (`200`)
- API-key revoke: passed (`204`)

Actual deletion execution, scheduled retention jobs, legal-policy configuration, and distributed rate-limit storage remain production-hardening work for Phase 11 and deployment operations.

## Backend Phase 11 — Testing and production readiness

**Status:** Complete as a private-beta readiness foundation

### Completed

- Added Node test-runner unit and contract tests for domains, event validation/masking, analytics ranges, and API-key encryption.
- Added opt-in API integration test harness.
- Added non-interactive ESLint CLI configuration for API and dashboard TypeScript.
- Added `/ready` readiness endpoint covering database and enabled event-pipeline state.
- Added isolated production build support through `NEXT_DIST_DIR` for safe local verification.
- Added GitHub Actions CI for Prisma validation, generation, lint, typecheck, tests, and build.
- Added deployment, environment, health-check, secret-rotation, and operations documentation.
- Added database migration status command.

### Verification

- Unit/contract tests: passed (4/4)
- Optional integration suite: available and skipped unless explicitly enabled
- ESLint: passed
- Prisma schema validation: passed
- API and dashboard typechecks: passed
- Dashboard production build in isolated `.next-ci`: passed with existing Autoprefixer warnings
- API production build: passed
- Readiness endpoint: passed (`200` with database available and pipeline disabled)

Remaining production operations—external service provisioning, distributed rate limiting, retention jobs, monitoring integration, and legal-policy review—must be completed before public launch.

## Infrastructure Phase 12 — Production deployment foundation

**Status:** Deployment automation complete; external service provisioning pending

### Completed

- Added `prisma migrate deploy` for non-interactive production migrations.
- Added production environment validation for required secrets, service URLs, pipeline flags, encryption-key format, and production CORS safety.
- Added non-mutating RabbitMQ, Redis, and ClickHouse connectivity checks.
- Added a ClickHouse schema application command using `apps/api/sql/events.sql`.
- Documented provisioning order, secret-manager requirements, backups, retention, restore testing, and rollout checks in `DEPLOYMENT.md`.

### Verification

- Prisma schema validation: passed
- Production migration deployment: passed; 5 migrations found and no pending migrations
- Unit/contract tests: passed (4/4)
- ESLint: passed
- API and dashboard typechecks: passed
- External RabbitMQ, Redis, and ClickHouse provisioning: pending deployment credentials and hosted resources

Phase 12 remains open until the four production services are provisioned, reachable from the API deployment, and `/health/db` plus `/ready` are healthy with the production pipeline configuration.

## Frontend Phase 1 — Registration and authentication UX

**Status:** Complete

### Completed

- Added the browser registration page at `/register`.
- Connected registration to `POST /api/v1/auth/register` and redirected new users to onboarding.
- Added client-side name, email, password, and password-confirmation validation.
- Added friendly handling for duplicate email, invalid credentials, validation, expired session, and API-unavailable errors.
- Added login/register navigation and removed prefilled test credentials from the login page.
- Added protected dashboard redirect when live mode has no valid session.
- Added sign-out action that revokes the refresh token and returns to login.

### Verification

- Dashboard ESLint: passed
- Dashboard typecheck: passed

The remaining authentication work is password recovery and email verification, which depends on the corresponding backend workflows.

## Frontend Phase 2 — Website onboarding and tracking installation

**Status:** Complete

### Completed

- Replaced the placeholder onboarding form with a live website-creation flow.
- Added client-side domain normalization and validation for domain-only values.
- Connected website creation to the authenticated organization API.
- Added tracking-script retrieval, copy-to-clipboard, tracking ID display, and installation instructions.
- Added pending, verified, and not-detected installation states.
- Added connection verification with retry guidance for unpublished scripts, incorrect domains, and ad blockers.
- Added live-mode redirect for unauthenticated onboarding access.
- Preserved a useful mock-mode demo path for local UI development.

### Verification

- Dashboard ESLint: passed
- Dashboard typecheck: passed
- Dashboard production build: passed

The backend collector and hosted tracking-script delivery still need production infrastructure before real website events can be verified outside local development.

## Frontend Phase 3 — Live overview analytics

**Status:** Complete

### Completed

- Replaced the Overview page’s mock metrics with authenticated live analytics requests in live mode.
- Added website selection and 7/30/90-day date-range filters.
- Connected visitors, sessions, conversion rate, traffic trend, and top-page data.
- Added explicit unavailable states for realtime visitors and AI insights until their APIs are available.
- Added loading, empty, error, and retry states with installation and onboarding actions.
- Preserved mock mode with a visible demo-data notice for local development.
- Added live-mode API error handling and safe chart behavior for empty or single-point datasets.

### Verification

- Dashboard ESLint: passed
- Dashboard typecheck: passed
- Dashboard production build: passed

The Overview can display live values once ClickHouse is enabled and populated. Realtime visitors, bounce/average-session fields, and generated AI insights remain dependent on their backend capabilities.

## Frontend Phase 4 — Visitors, behaviour, forms, and sessions

**Status:** Complete

### Completed

- Connected Visitors to authenticated live visitor analytics with date ranges, search, status filtering, sorting, and detail states.
- Connected Behaviour to live click, page-view, and scroll event aggregates.
- Connected Forms to live form-start, form-submit, completion-rate, and abandonment data.
- Added website/date selection, loading, empty, error, and retry states to all Phase 4 pages.
- Replaced unavailable visitor metadata, timelines, field-level form data, scroll depth, rage/dead click detection, and journey aggregation with explicit not-available guidance instead of fabricated values.
- Preserved mock-data mode for local demos.

### Verification

- Dashboard ESLint: passed
- Dashboard typecheck: passed
- Dashboard production build: passed

Detailed session timelines, field-level form events, scroll depth, rage/dead click detection, and landing/exit aggregation remain backend data-collection work for later phases.

## Frontend Phase 5 — Heatmaps and replays

**Status:** Complete

### Completed

- Connected Heatmaps to authenticated page-level click analytics with website-scoped date queries.
- Added page selection and 7/30/90-day filters.
- Added explicit unavailable states for coordinate-level heatmaps, scroll-depth mode, dead-click mode, and AI summaries when the event payload does not support them.
- Connected Replays to authenticated session aggregates with date filters and conversion status.
- Added privacy-safe unavailable states for screen playback, device/country metadata, detailed timelines, and AI summaries until session recording storage is enabled.
- Preserved mock-mode visual demos and existing privacy organization scoping through the authenticated API context.

### Verification

- Dashboard ESLint: passed
- Dashboard typecheck: passed
- Dashboard production build: passed

Coordinate-level heatmaps and full replay playback remain dependent on backend tracking payload and session-storage capabilities.

## Frontend Phase 6 — Funnel and conversion configuration

**Status:** Complete as a frontend configuration foundation

### Completed

- Added funnel create and edit flows in the dashboard.
- Added conversion-goal selection and funnel-step configuration.
- Added validation for funnel names, minimum steps, empty fields, duplicate paths, and missing goals.
- Added step add/remove controls with an eight-step limit.
- Added archive control and demo-mode state updates.
- Added role-aware controls for owner, admin, and developer permissions.
- Added live-mode messaging when funnel persistence and analytics configuration are not connected.
- Added date-range controls and preserved organization-scoped live API loading.

### Verification

- Dashboard ESLint: passed
- Dashboard typecheck: passed
- Dashboard production build: passed

Live funnel persistence, conversion-goal storage, permissions enforcement, and funnel analytics queries remain backend Phase 16 work.

## Frontend Phase 7 — AI insights experience

**Status:** Complete as an insights UI foundation

### Completed

- Connected the Insights page to the authenticated insights analytics endpoint.
- Added 7/30/90-day filters and live loading, empty, error, and retry states.
- Added category, priority, status, and recent/priority sorting controls.
- Added evidence, confidence, problem, reason, business impact, recommendation, and expected-improvement rendering.
- Added resolve and dismiss lifecycle actions in demo mode.
- Added role-aware review controls and live-mode messaging while insight persistence is unavailable.
- Added an explicit AI generation unavailable state when baseline signals or the AI service are not enabled.

### Verification

- Dashboard ESLint: passed
- Dashboard typecheck: passed
- Dashboard production build: passed

AI generation, persisted insight lifecycle, deduplication, provider controls, and evidence-backed insight storage remain backend Phase 17 work.

## Frontend Phase 8 — Settings, privacy, and account operations

**Status:** Complete as an account operations foundation

### Completed

- Added API-key management with live list, create, revoke, role-aware controls, and one-time secret display.
- Added organization data export download and privacy export/deletion request flows.
- Added request confirmation for destructive deletion actions and request history.
- Added organization audit-log viewer.
- Added privacy, retention, and secret-handling explanations in Settings.
- Added live loading, empty, error, and unavailable states while preserving mock-mode behavior.
- Added authenticated API client methods for keys, privacy requests, exports, and audit logs.

### Verification

- Dashboard ESLint: passed
- Dashboard typecheck: passed
- Dashboard production build: passed

Scheduled deletion execution, retention jobs, invitation management, billing operations, and legal-policy review remain backend/production operations work.

## Frontend Phase 9 — Quality, accessibility, and production polish

**Status:** Complete as a frontend quality and accessibility foundation

### Started

- Added global loading, error, and not-found boundaries with recovery actions.
- Added a keyboard skip link and active-navigation semantics.
- Added visible focus styles and reduced-motion support.
- Added a lightweight dashboard route smoke-check script.
- Added responsive safeguards for toolbar, settings, funnel, privacy, and account-operation controls.

### Verification

- Dashboard ESLint: passed
- Dashboard typecheck: passed
- Dashboard production build: passed
- Dashboard browser-route smoke check: passed for `/`, `/login`, `/register`, and `/settings`

The production build still reports two non-blocking existing Autoprefixer warnings for `align-items:end` and `justify-content:end`; these can be cleaned up during the CSS consolidation pass.

## Tracking SDK Phase 1 — SDK runtime and `/tracker.js` serving

**Status:** Complete as an initial browser SDK foundation

### Completed

- Added a dependency-free browser tracking SDK under the API workspace.
- Added `GET /tracker.js` with JavaScript content type and short-lived cache headers.
- Added anonymous visitor and tab session identifiers with safe storage fallbacks.
- Added automatic `session_start` and `page_view` events.
- Added privacy-safe URL/referrer normalization and limited context metadata.
- Added `sendBeacon` delivery with a `fetch` keepalive fallback.
- Added unit coverage for the tracker script contract.

### Verification

- API ESLint: passed
- API typecheck: passed
- API unit tests: passed (5 tests)
- Local `/tracker.js` response check: passed with HTTP 200, JavaScript content type, cache headers, and cross-origin resource policy

## Tracking SDK Phase 2 — Event capture and delivery

**Status:** Complete as a browser event-capture foundation

### Completed

- Added queued event delivery with timed, size-based, and page-hide flushing.
- Added SPA page-view tracking for `pushState`, `replaceState`, and `popstate`.
- Added privacy-safe click metadata without visible text or input values.
- Added scroll milestones at 25%, 50%, 75%, and 100%.
- Added form-start and form-submit events without form values.
- Added explicit `window.aiGrowth.track`, `conversion`, and `flush` methods.
- Preserved the existing collector payload contract and added SDK hook tests.

### Verification

- API ESLint: passed
- API typecheck: passed
- API unit tests: passed (6 tests)
- Tracker JavaScript syntax check: passed
- Local `/tracker.js` Phase 2 response check: passed with HTTP 200 and all event-delivery hooks present

## Tracking SDK Phase 3 — Consent and privacy safeguards

**Status:** Complete as a browser privacy-control foundation

### Completed

- Added consent-gated tracking with `data-require-consent="true"`.
- Added runtime consent and opt-out methods through `window.aiGrowth`.
- Added persistent opt-out state and Do Not Track handling.
- Added browser-side filtering for sensitive property names and values.
- Preserved query-string and fragment removal for URLs and referrers.
- Kept form values out of all browser-generated events.

### Verification

- API ESLint: passed
- API typecheck: passed
- API unit tests: passed (7 tests)
- Tracker JavaScript syntax check: passed
- Local `/tracker.js` Phase 3 response check: passed with HTTP 200 and consent/privacy controls present

## Tracking SDK Phase 4 — Tracking verification integration

**Status:** Complete as a tracking installation and verification foundation

### Completed

- Added explicit verification states for pending, verified, paused, and archived websites.
- Added website status to tracking-script configuration responses.
- Kept domain matching and invalid-domain protection active during verification.
- Prevented paused and archived websites from reporting as connected.
- Updated Settings installation UI with status-aware badges and verification controls.
- Preserved the original first-event timestamp while updating later activity.
- Added API contract coverage for all verification states.

### Verification

- API ESLint: passed
- API typecheck: passed
- API unit tests: passed (8 tests)
- Dashboard ESLint: passed
- Dashboard typecheck: passed
- Dashboard production build: passed

The dashboard build continues to report two existing non-blocking Autoprefixer warnings for `align-items:end` and `justify-content:end`.

## Tracking SDK Phase 6 — Test coverage and browser validation

**Status:** Complete as a local browser-validation foundation

### Completed

- Added a Node VM browser-runtime harness for SDK event behavior.
- Covered baseline, click, form, scroll, conversion, SPA, consent, and opt-out flows.
- Added a static installation fixture for manual local browser testing.
- Added the `smoke:tracker` command for live `/tracker.js` route checks.
- Kept the validation path dependency-free.

### Verification

- API ESLint: passed
- API typecheck: passed
- API unit tests: passed (12 tests)
- Tracker runtime tests: passed
- Tracker smoke check: passed against a fresh local API process

## Tracking SDK Phase 5 — Persistence and analytics handoff

**Status:** Complete as a persistence and analytics handoff foundation

### Completed

- Corrected SDK form metadata to use the `formId` key expected by analytics queries.
- Centralized ClickHouse event-row mapping and preserved website/tracking identity.
- Added contract coverage for ClickHouse field mapping and JSON serialization.
- Preserved disabled-pipeline behavior for local development.
- Preserved RabbitMQ retry and dead-letter handling for persistence failures.
- Confirmed analytics authorization resolves organization membership and website ownership before querying event data.

### Verification

- API ESLint: passed
- API typecheck: passed
- API unit tests: passed (10 tests)
- Dashboard ESLint: passed
- Dashboard typecheck: passed

## Tracking SDK Phase 7 — Documentation and handoff

**Status:** Complete

### Completed

- Added `TRACKING-SDK.md` with installation, event, consent, privacy, local testing, and limitation guidance.
- Linked the SDK documentation from the project README.
- Updated Onboarding and Settings installation copy with consent instructions.
- Documented the static local fixture and tracker smoke command.
- Separated SDK completion from deployment and external-service provisioning.

### Verification

- Documentation links and commands reviewed against the current repository structure.
- Local testing workflow documented without adding deployment dependencies.

## Free Infrastructure Phase 1 — Free architecture and configuration

**Status:** Complete as a configuration foundation

### Completed

- Added explicit `FREE_MVP_MODE` and PostgreSQL-first analytics configuration.
- Added retention and maximum daily tracking-event settings with safe bounds.
- Exposed infrastructure mode and limits through API metadata.
- Made production environment validation optional for RabbitMQ, Redis, and ClickHouse in explicit free-MVP mode.
- Added unit coverage for free-mode defaults and configuration bounds.

### Verification

- API ESLint: passed
- API typecheck: passed
- API unit tests: passed (13 tests)
- Fresh API metadata check: passed with free MVP mode and PostgreSQL storage
- Free-mode production environment validation: passed

## Free Infrastructure Phase 2 — PostgreSQL event storage

**Status:** Complete

### Started

- Added the Prisma `TrackingEvent` model with tenant, visitor, session, event-type, and retention indexes.
- Added PostgreSQL event mapping and optional collector persistence.
- Added duplicate-safe persistence using the website/event composite key.
- Added the retention cleanup command `db:cleanup:events`.

### Verification

- Prisma format, validation, client generation, and migration status: passed
- API ESLint and typecheck: passed
- API unit tests: passed (14 tests)
- Temporary API runtime with PostgreSQL storage enabled: passed
- Live collector conversion event persisted and read back from Neon: passed
- Retention cleanup command: passed; no events older than 30 days were removed

## Free Infrastructure Phase 3 — PostgreSQL analytics queries

**Status:** Complete

### Completed

- Replaced ClickHouse-only analytics reads with PostgreSQL aggregations.
- Preserved the existing overview, visitors, sessions, forms, behaviour,
  heatmaps, replays, and insights API contracts.
- Added bounded date-range filtering and limit/offset pagination to the
  PostgreSQL analytics queries.
- Preserved explicit unavailable-state handling for analytics query failures.

### Verification

- API ESLint: passed
- API typecheck: passed
- API unit tests: passed (14 tests)
- Live Neon analytics smoke test: passed for overview, visitors, sessions,
  forms, behaviour, heatmaps, and replays
- Conversion metrics, daily traffic, latest page, session conversion, and
  pagination output verified against stored PostgreSQL event data

## Free Infrastructure Phase 4 — Free hosting readiness

**Status:** Complete

### Completed

- Added `render.yaml` with free API and dashboard web services.
- Added API production compilation and start scripts, including Render `PORT`
  support.
- Added a Render startup Prisma migration command compatible with free-tier
  services.
- Updated deployment guidance for Neon + PostgreSQL-only free MVP hosting.
- Documented public URL, CORS, secret, health-check, and sleep/wake setup.

### Verification

- API production build, typecheck, and lint: passed
- Dashboard production build, typecheck, and lint: passed
- Free-mode production environment validation: passed
- Render Blueprint YAML parse: passed
- Production API smoke test: `/health`, `/health/db`, `/ready`, and
  `/tracker.js` all returned HTTP 200

## Free Infrastructure Phase 5 — Free MVP end-to-end testing

**Status:** Complete

### Completed

- Added `scripts/smoke-free-mvp.mjs` and the API workspace `smoke:free` command.
- The smoke test checks API health/readiness, tracker delivery, PostgreSQL
  free-mode metadata, dashboard routes, and persisted event rows.
- Covered page-view, click, form-start, form-submit, and conversion events.
- Documented environment overrides for testing deployed API/dashboard URLs.

### Verification

- Production API and dashboard artifacts started locally: passed
- Free MVP smoke check: passed; 5 representative events persisted in Neon
- Dashboard routes `/`, `/login`, `/register`, and `/settings`: passed
- API `/health`, `/health/db`, `/ready`, and `/tracker.js`: passed
- Existing browser SDK runtime and unit coverage remains passing

## Free Infrastructure Phase 6 — Cost and scale decision

**Status:** Complete

### Completed

- Added `scripts/report-free-usage.mjs` and the API workspace `report:free`
  command.
- Added read-only measurements for API health latency, event volume, database
  size, tracking-table size, website count, retention coverage, and configured
  free-tier limits.
- Documented measurable triggers for adding distributed rate limiting, a queue,
  or ClickHouse.

### Verification

- Usage report against Neon: passed
- Current baseline: 11 events, 5 websites, 8.6 MB database, 114 KB event table
- Retention coverage: 11 events within 30 days
- PostgreSQL-only decision: retained for the current low-volume MVP
- First health check latency: approximately 3.46 seconds, recorded as a
  free-tier wake-up limitation to monitor

## Remaining Plan Phase 16 — Funnel and conversion configuration

**Status:** Complete

### Completed

- Added persistent PostgreSQL funnel and funnel-step definitions.
- Added tenant-scoped create, update, list, and archive APIs with organization
  role authorization.
- Added conversion-goal validation and duplicate-step protection.
- Added live PostgreSQL funnel analytics for visitors, conversions, rates, and
  step drop-offs.
- Connected the dashboard funnel editor to live persistence APIs.
- Added audit records for funnel creation, updates, and archive operations.

### Verification

- Prisma migration and database status: passed
- API typecheck/build: passed
- API unit tests: passed (14/14)
- Dashboard production build: passed
## Remaining Plan Phase 18 — Privacy, retention, and compliance operations

**Status:** Complete as an operational privacy foundation

- Added consent records, consent-granted tracking events, and retention cleanup for tracking and consent data.
- Added the privacy processor command for queued export/deletion requests and made admin completion of DELETE requests remove tracking, consent, insight, and funnel records.
- Added `PRIVACY.md` and deployment guidance covering data minimization, masking, consent/opt-out, retention, GDPR, CCPA, India DPDP, and audit-log review.
- Kept account, billing, and audit records outside the analytics deletion scope pending an explicit legal retention policy.
## Remaining Plan Phase 19 — Production observability and reliability

**Status:** Complete as a free-MVP observability and reliability foundation

- Added bounded in-memory request metrics for uptime, p50/p95/max latency, 5xx responses, and rate-limited responses.
- Added `/health/metrics` and a dependency-free health load-test command.
- Added `RELIABILITY.md` with initial service targets, alert thresholds, backup/restore drill, rollback runbook, load-testing safeguards, and incident ownership.
- Kept monitoring dependency-free for the free MVP; external log shipping and paid error-monitoring integrations remain optional deployment enhancements.
## Remaining Plan Phase 20 — Private beta validation

**Status:** In progress — protocol and tooling complete; real beta-site validation pending

- Added `PRIVATE-BETA.md` with the real-site onboarding protocol, source-analytics comparison guidance, activation and retention baselines, insight usefulness review, issue severity, and exit criteria.
- Added `beta:check` to verify the deployed API, database readiness, observability endpoint, dashboard routes, tracker script, and optionally one synthetic tracking event.
- Real websites, cohort measurements, and beta feedback require participating sites and will be recorded during the next validation cycle.
## Live Tracking Phase 1 — Live activity API

**Status:** Complete as an authenticated live-analytics API foundation

- Added `GET /api/v1/analytics/live` with organization and website authorization.
- Added active visitor counts over a bounded 30–900 second activity window.
- Added privacy-safe recent event metadata with a configurable result limit.
- Added the dashboard API client contract for the live tracking response.
- API/dashboard typechecks, builds, lint, and the 14 API unit tests passed.
## Live Tracking Phase 2 — Dashboard live widgets

**Status:** Complete as a live activity widget foundation

- Connected the Overview page to the authenticated live analytics client.
- Added active visitor count, recent event activity, privacy-safe paths, activity window, and last-updated status.
- Added visible loading, empty, unavailable, and retry states while preserving mock mode.
- Added a 15-second visible-tab refresh loop and pause/resume behavior for hidden tabs.
- Dashboard typecheck/lint/build and API unit tests passed.
## Live Tracking Phase 3 — Polling reliability and freshness

**Status:** Complete as a resilient polling foundation

- Prevented overlapping live activity requests.
- Paused polling for hidden tabs and resumed with an immediate refresh when visible.
- Stopped polling after three consecutive failures and added manual retry recovery.
- Added clear stale status and reconnect messaging for previously loaded live data.
- Dashboard typecheck, lint, and production build passed.
## Live Tracking Phase 4 — Privacy and performance safeguards

**Status:** Complete as a privacy and performance foundation

- Removed visitor identifiers from the live activity response; the dashboard only receives event type, timestamp, and safe page path.
- Added no-store response headers, bounded payloads, and a 30-request-per-minute per-user/website live polling limit.
- Preserved tenant authorization, indexed time-window queries, and existing retention/masking behavior.
- API/dashboard typecheck, lint, build, and API tests passed.
## Live Tracking Phase 5 — Testing and verification

**Status:** Complete as an automated contract and verification foundation

- Added live-query bound tests for the 50-event maximum and 30–900 second activity window.
- Added a privacy contract test confirming live activity objects exclude visitor identifiers.
- Verified the full API/dashboard build, lint, typecheck, and API test suite.
- Real-site event comparison remains a beta operation using `PRIVATE-BETA.md` and the deployed beta check command.
## Live Tracking Heartbeat — Idle visitor presence

**Status:** Complete as a lightweight presence enhancement

- Added a visible-page `live_heartbeat` event every 60 seconds to the tracking SDK.
- Heartbeats respect consent, Do Not Track, opt-out, and tab visibility.
- Added tracker contract coverage and SDK documentation.

## Phase 21 — Visitor session timeline

**Status:** Complete as a privacy-safe visitor journey foundation

- Added a bounded timeline of the latest 20 visitor events.
- Added readable entries for page views, clicks, forms, scrolls, sessions, custom events, and conversions.
- Connected the Visitors detail panel to live timeline data.
- Preserved privacy by returning event type, safe path, timestamp, and scroll depth only.
- API tests and API/dashboard production builds passed.

## Phase 22 — CRO Insights Engine

**Status:** Complete as an explainable, free-MVP insights foundation

- Preserved the existing deterministic insight generator and expanded it with page-level content opportunities.
- Detects low conversion rate, form abandonment, dense click activity, and high-traffic pages without recorded conversions.
- Includes evidence, confidence, business impact, recommendation, priority, and expected improvement for each finding.
- Limits page analysis to the top 20 pages and creates no paid AI-service dependency.
- API tests and API/dashboard production builds passed.

## Phase 23 — Funnel Intelligence

**Status:** Complete as an ordered, evidence-backed funnel foundation

- Funnel steps now require ordered visitor progression instead of independent page counts.
- Conversion goals are scoped to visitors who entered the funnel.
- Added largest drop-off detection with step-level bottleneck markers.
- Added confidence, reason, recommendation, and expected-improvement guidance.
- API tests and API/dashboard production builds passed.

## Phase 24 — Form Intelligence

**Status:** Complete as a privacy-safe form performance foundation

- Added validation-error tracking without collecting field names, labels, or values.
- Added form page, starts, submissions, validation errors, visitors, completion, and abandonment metrics.
- Added live form recommendations based on abandonment and validation friction.
- Connected validation-error summaries and recommendations to the Forms dashboard.
- API tests and API/dashboard production builds passed.

## Phase 25 — Behaviour Intelligence

**Status:** Complete as a bounded behaviour-signal foundation

- Added page-level click targets and visitor counts.
- Added average scroll depth by page and low-depth issue detection.
- Added repeated-click clusters as rage-click candidates.
- Added unlinked click targets as dead-click candidates for review.
- Added landing and exit page session summaries.
- Connected live metrics and issue summaries to the Behaviour dashboard.
- API tests and API/dashboard production builds passed.

## Phase 26.1 — Unified CRO recommendation contract

**Status:** Complete as a shared, explainable recommendation contract

- Added shared CRO source, category, priority, confidence, evidence, signal, and recommendation types.
- Added stable website-insight fingerprints with normalized source, rule, and entity keys.
- Added path normalization, bounded/deduplicated evidence, and minimum sample thresholds.
- Added contract tests for normalization, fingerprint stability, duplicate evidence, and sample gating.
- No live recommendation rules or API response behavior changed in this phase.

## Phase 26.2 — Unified CRO recommendation rules

**Status:** Complete as a deterministic cross-signal rule engine

- Added funnel bottleneck recommendations using ordered step drop-off evidence.
- Added form validation-friction recommendations with minimum-start and error-rate gating.
- Added rage-click, dead-click, and low-scroll behaviour recommendations with sample safeguards.
- Added high-traffic/no-conversion page recommendations using normalized page evidence.
- Connected the rule engine to the existing insights generator while preserving current insight lifecycle behavior.
- API tests and API TypeScript build passed.

## Phase 26.3 — Unified recommendation persistence

**Status:** Complete as an idempotent and resilient insight refresh foundation

- Changed insight upserts to refresh all generated fields and evidence while preserving review status.
- Added candidate deduplication before persistence using stable website-scoped fingerprints.
- Added partial-source resilience so one unavailable analytics query does not break the Insights endpoint.
- Added unavailable-source metadata for operator-visible diagnostics.
- Added persistence contract coverage for stable recommendation deduplication.
- API tests and API TypeScript build passed.

## Phase 26.4 — Insights Centre experience

**Status:** Complete as a source-aware live recommendation workspace

- Added recommendation source labels and source filtering.
- Added visible warnings when one analytics source is temporarily unavailable.
- Preserved live refresh, loading, empty, error, resolve, and dismiss states.
- Added source context to recommendation details and replaced the misleading AI-ranked label with evidence-ranked messaging.
- API tests, API build, dashboard production build, and diff validation passed.

## Phase 26.5 — Verification and operational readiness

**Status:** Complete as a verified free-MVP recommendation foundation

- Added privacy contract coverage for recommendation output and bounded evidence.
- Verified stable fingerprints, duplicate suppression, sample gating, and required CRO fields.
- Verified API unit tests, API TypeScript build, dashboard production build, and `git diff --check`.
- Confirmed no paid AI or infrastructure dependency was introduced.
- Known limitation: expected conversion improvement remains a directional estimate, not a guarantee.

## Phase 27 — Free in-dashboard CRO alerts

**Status:** Complete as an in-app high-priority alert foundation

- Added a bounded alert queue derived from open, high-priority persisted insights.
- Added source, category, page, and review context to each alert.
- Added alert count and alert cards to the live Insights Centre.
- Resolved and dismissed insights are excluded from the active alert queue.
- Documented the deliberate limitation: external email and Slack delivery require a later optional adapter.
