# AI Growth Backend Implementation Plan

**Approach:** Backend-first integration in small, testable phases

**Goal:** Turn the current API and Prisma foundation into a secure, multi-tenant backend that can power the dashboard with live website and analytics data.

## Principles

- Keep organization and website data tenant-isolated.
- Validate every request at the API boundary.
- Never expose secrets or sensitive visitor data.
- Build authenticated API flows before accepting customer event data.
- Keep response shapes compatible with the frontend API adapter.
- Add tests and documentation with each phase.

## Phase 1 — PostgreSQL and Prisma Migration

### Scope

- Start PostgreSQL locally.
- Apply the initial Prisma migration.
- Generate Prisma Client.
- Add database connection handling.
- Add a database health check.
- Add seed data for local development.

### Deliverable

The API can connect to PostgreSQL and persist users, organizations, memberships, and websites.

## Phase 2 — Authentication Foundation

### Scope

- Password hashing.
- User registration.
- Login.
- JWT access tokens.
- Refresh-token strategy.
- Logout and token revocation.
- Current-user endpoint.
- Authentication error handling.

### Deliverable

A user can securely register, log in, log out, and access a protected API route.

## Phase 3 — Organizations and Permissions

### Scope

- Create organization during onboarding.
- Organization membership creation.
- Role-aware authorization middleware.
- Current organization endpoint.
- Organization switching.
- Invite member placeholder/API.
- Permission checks for Owner, Admin, Developer, Marketing, and Viewer.

### Deliverable

Every protected request is scoped to an organization and checked against the user’s role.

## Phase 4 — Website Management

### Scope

- Create website.
- Generate unique tracking ID.
- List organization websites.
- Get website details.
- Update website settings.
- Pause and archive website.
- Delete website with safeguards.
- Website ownership and authorization checks.

### Deliverable

An authenticated organization can create and manage websites from the dashboard.

## Phase 5 — Tracking Installation and Verification

### Scope

- Tracking script configuration endpoint.
- Tracking ID validation.
- Website connection verification.
- First-event detection.
- Installation status.
- Domain validation.
- API rate limiting for verification requests.

### Deliverable

The onboarding flow can provide a tracking script and confirm when a website starts sending events.

## Phase 6 — Frontend API Integration

### Scope

- Connect authentication state to the dashboard.
- Connect organization and website selectors.
- Connect website settings.
- Replace website mock data with live API responses.
- Add loading, error, retry, and empty states.
- Add API pagination and date-range query support.

### Deliverable

The dashboard uses live account, organization, and website data.

## Phase 7 — Event Collector API

### Scope

- Public event ingestion endpoint.
- Tracking ID authentication.
- Payload validation with Zod.
- Event size limits.
- Visitor and session identifiers.
- Duplicate-event protection.
- CORS and origin handling.
- Rate limiting.
- Privacy masking before persistence.

### Deliverable

The tracking SDK can safely send validated events to the API.

## Phase 8 — Queue and Event Persistence

### Scope

- RabbitMQ connection.
- Event queues.
- Retry policy.
- Dead-letter queue.
- Event consumer.
- ClickHouse event persistence.
- Redis active-session state.
- Event ingestion metrics.

### Deliverable

Events are processed asynchronously without blocking the collector or losing data.

## Phase 9 — Analytics API

### Scope

- Overview metrics endpoint.
- Visitor and session endpoints.
- Forms analytics endpoint.
- Funnels analytics endpoint.
- Behaviour analytics endpoint.
- Heatmap endpoint.
- Session replay endpoint.
- AI insights endpoint.
- Pagination, filtering, sorting, and date ranges.

### Deliverable

All dashboard screens can replace mock data with live analytics responses.

## Phase 10 — Security and Compliance

### Scope

- Password and secret protection review.
- API-key encryption.
- PII masking.
- Sensitive form-field masking.
- GDPR deletion and export support.
- CCPA support.
- India DPDP Act support.
- Audit logging.
- Request logging without sensitive payloads.
- Security headers and CORS policy.

### Deliverable

The backend has documented security controls and safe handling of visitor data.

## Phase 11 — Testing and Production Readiness

### Scope

- Unit tests for services and validation.
- Integration tests for auth and website APIs.
- Database migration checks.
- API contract tests.
- Rate-limit tests.
- Error monitoring.
- Structured logging.
- Health and readiness endpoints.
- CI checks for typecheck, lint, test, and build.
- Deployment environment documentation.

### Deliverable

The backend is ready for private beta deployment.

## Initial API Contract

### Authentication

```text
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/refresh
GET  /auth/me
```

### Organizations

```text
GET  /organizations/current
POST /organizations
GET  /organizations/:id/members
POST /organizations/:id/invites
```

### Websites

```text
GET    /websites
POST   /websites
GET    /websites/:id
PATCH  /websites/:id
POST   /websites/:id/verify
POST   /websites/:id/archive
DELETE /websites/:id
```

### Analytics

```text
GET /analytics/overview
GET /analytics/visitors
GET /analytics/forms
GET /analytics/funnels
GET /analytics/behaviour
GET /analytics/heatmaps
GET /analytics/replays
GET /analytics/insights
```

## Phase Completion Criteria

Each phase is complete when:

- The API contract is documented.
- Request validation exists.
- Authorization is tested.
- Success and error responses are defined.
- The frontend integration path is clear.
- Typecheck and relevant tests pass.
- Execution notes are updated.

## Immediate Task

Start Phase 1 by running PostgreSQL and applying the Prisma migration:

```bash
docker compose up -d postgres
npm run db:migrate --workspace @ai-growth/api
```
