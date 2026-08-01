# Admin Console Implementation Plan

## Objective

Build a secure, admin-only console for monitoring platform customers, usage,
subscription status, and operational health. The first release must work with
the current free MVP stack and must not pretend that an organization is paid
until billing data confirms it.

## Product definitions

- **User:** one registered account identified by email.
- **Organization:** one customer workspace owned by one or more members.
- **Website:** a tracked website connected to an organization.
- **Free:** organization plan is `FREE` and has no active paid subscription.
- **Paid:** organization has a server-confirmed active paid subscription.
- **Active customer:** organization with activity in the selected reporting window.
- **Active user:** user with a successful login or tracked workspace activity in
  the selected reporting window.

## Admin security requirements

- Add an explicit platform-admin identity/role; organization `OWNER` is not a
  platform admin.
- Protect every admin API route on the server.
- Deny admin access by default and return `403` for non-admin users.
- Do not expose password hashes, refresh tokens, reset tokens, or billing
  provider secrets.
- Record admin reads and mutations in the existing audit-log system.
- Add rate limiting and pagination to admin endpoints.
- Support an emergency admin disable/revocation path.

## Admin dashboard information architecture

### Overview

- Total users
- Active users
- Total organizations
- Active organizations
- Free organizations
- Paid organizations
- Total websites
- Events in the selected period
- Database/storage usage and free-tier limits

### Customers

- Search by user email, organization name, or website domain
- Filters: Free, Paid, Trial, Past due, Canceled, Suspended
- Columns: customer, owner, websites, plan, status, last activity, created date
- Customer detail page with members, websites, usage, audit history, and status

### Usage

- Events by day and organization
- Visitors/sessions by organization
- API requests and rate-limit activity
- Storage usage and retention status
- Free-tier limit warnings

### Billing

- Current plan and subscription status
- Provider customer/subscription IDs stored as references only
- Trial dates, renewal date, cancellation date, and past-due state
- Billing events/webhook history
- Manual plan override only with an audit reason

### Audit and operations

- Admin sign-ins and failed access attempts
- Plan/status changes
- Account suspension/reactivation
- Data exports/deletion requests
- Filterable and exportable audit records

## Data model changes

1. Add a platform-admin role or `PlatformAdmin` table linked to `User`.
2. Add `Subscription` with organization ID, provider, provider customer ID,
   provider subscription ID, plan, status, period dates, and timestamps.
3. Add `BillingEvent` with provider event ID, type, payload hash, processing
   status, and timestamps for idempotent webhook handling.
4. Add indexes for organization plan/status, subscription status, user email,
   and activity timestamps.
5. Reuse existing `Organization.plan`, `Organization.status`, and audit-log
   fields during the transition.

## Phased implementation

### Phase 1 — Admin access foundation

- Define platform-admin authorization.
- Add admin authentication middleware and permission checks.
- Add audit entries for admin sign-in and denied access.
- Add tests for allowed, denied, and revoked admin access.

**Acceptance:** a normal workspace owner cannot access `/admin` or admin APIs;
an approved platform admin can access them.

### Phase 2 — Admin API and overview

- Add authenticated admin overview endpoint.
- Return counts for users, active users, organizations, websites, free
  organizations, paid organizations, and event volume.
- Support date range and timezone-safe boundaries.
- Add pagination metadata and bounded query limits.

**Acceptance:** overview values are calculated from PostgreSQL and never from
frontend mock data.

### Phase 3 — Customer directory

- Add searchable, filterable customer endpoint.
- Add customer detail endpoint.
- Include organization owner, member count, websites, plan, status, last
  activity, and creation date.
- Add empty, loading, error, and pagination states.

**Acceptance:** an admin can find any user or organization by email, name, or
domain and inspect its current state.

### Phase 4 — Usage and activity reporting

- Add organization-level event, visitor, session, and API usage queries.
- Add daily trend aggregation.
- Add free-tier usage thresholds and warning states.
- Ensure queries remain bounded and indexed for the free PostgreSQL setup.

**Acceptance:** an admin can identify the highest-usage customers and compare
usage against free-tier limits.

### Phase 5 — Admin frontend

- Add an admin route group and navigation entry visible only to admins.
- Build overview cards, customer table, customer detail, usage charts, and
  audit table.
- Add search, filters, date range controls, pagination, and responsive states.
- Keep customer PII minimized and avoid rendering sensitive secrets.

**Acceptance:** the admin can complete the core monitoring workflow without
database access or shell commands.

### Phase 6 — Billing-ready subscription model

- Add subscription and billing-event migrations.
- Add provider-neutral plan/status mapping.
- Add idempotent webhook ingestion.
- Reconcile subscription status server-side.
- Keep a safe manual migration path from current `Organization.plan` values.

**Acceptance:** paid/free counts come from server-confirmed subscription state,
including cancellation and past-due cases.

### Phase 7 — Administrative actions and hardening

- Add suspend/reactivate actions with confirmation and reason.
- Add account data export and deletion workflow controls.
- Add audit log filters and CSV export.
- Add authorization, abuse, query-performance, and webhook replay tests.
- Add monitoring for admin errors and billing synchronization failures.

**Acceptance:** every administrative mutation is authorized, auditable,
recoverable where possible, and covered by tests.

## Free-MVP constraints

- Do not add Redis, RabbitMQ, ClickHouse, or a paid analytics service for the
  initial admin console.
- Use PostgreSQL aggregates with indexes and bounded time ranges.
- Do not claim revenue or paid customers until a billing provider is connected.
- Keep billing provider integration optional until the admin monitoring phases
  are complete.

## Verification checklist

- Admin and non-admin authorization tests pass.
- Customer counts match direct PostgreSQL verification queries.
- Free/paid filters match server-side subscription state.
- No secrets appear in API responses, logs, exports, or browser storage.
- Admin audit entries are created for every mutation.
- Dashboard build, API typecheck, migrations, and unit tests pass.
- Render deployment health checks remain green.

## Recommended execution order

Execute phases sequentially: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
→ Phase 6 → Phase 7. Commit each phase separately with a specific message.

## Execution note — Phase 1

**Status:** Completed.

Implemented the platform-admin foundation:

- Added the `PlatformAdmin` registry with revocation support.
- Added server-side `requirePlatformAdmin` authorization middleware.
- Added protected `GET /api/v1/admin/access` foundation endpoint.
- Added audit events for admin sign-in, granted access, and denied access.
- Added `admin:grant` and `admin:revoke` CLI commands for controlled bootstrap.
- Added the Prisma migration and repaired its migration history without resetting
  or deleting the existing Neon database.
- Verified API build, migration status, and all unit tests.

To grant access to an approved account:

```bash
npm run admin:grant --workspace @ai-growth/api -- user@example.com
```

## Execution note — Phase 2

**Status:** Completed.

Implemented the protected admin overview API:

- Added `GET /api/v1/admin/overview` with bounded date-range filtering.
- Added total, active, and new user counts.
- Added total, active, new, free, and paid organization counts.
- Added website and tracking-event totals.
- Added `auth.sign_in` audit events so active-user metrics are server-derived.
- Added admin overview audit events.
- Verified unauthenticated requests receive `401`.
- Verified API build and all unit tests.

## Execution note — Phase 4

**Status:** Completed.

Implemented the protected usage reporting API:

- Added `GET /api/v1/admin/usage` with bounded date ranges and optional
  organization filtering.
- Added daily event, unique visitor, and session trends.
- Added organization-level event, visitor, and session usage rankings.
- Added recorded audit-activity trends for operational activity visibility.
- Added PostgreSQL tracking-event table size reporting.
- Added free-MVP event thresholds, warning flags, and retention settings.
- Added admin usage-view audit events.
- Verified API build and all unit tests.

The API activity metric currently reports persisted audit activity; request-level
telemetry and rate-limit history can be expanded in a later operational phase.

## Execution note — Phase 5

**Status:** Completed.

Implemented the protected admin frontend at `/admin`:

- Added admin access validation before rendering live data.
- Added overview metric cards for users, organizations, plans, websites, and
  events.
- Added daily usage and recorded activity tables.
- Added customer search, Free/Paid/status filters, and pagination.
- Added customer detail inspection with members, websites, plan, status, and
  event usage.
- Added responsive admin-specific styles and loading/error/empty states.
- Verified the production dashboard build.

The admin page remains API-protected; a user cannot gain access by visiting the
URL without a platform-admin record.

The paid count currently uses the existing server-side organization plan field;
provider-confirmed billing state is scheduled for Phase 6.

## Execution note — Phase 7

**Status:** Completed.

Implemented administrative actions and hardening:

- Added protected suspend/reactivate actions for organizations with a required
  reason and transactional audit records.
- Added admin privacy-request listing and status controls for processing,
  completion, and rejection.
- Added filterable, bounded admin audit-log queries with CSV export.
- Added the admin-console UI controls for customer suspension and reactivation.
- Ensured mutations are server-authorized, reasoned, and auditable.
- Verified API typecheck/build, unit tests, dashboard build, and diff hygiene.

Data deletion remains an explicitly controlled privacy workflow: this phase
records and manages requests, but does not perform irreversible deletion from a
dashboard click.

## Execution note — Phase 6

**Status:** Completed.

Implemented the provider-neutral billing foundation:

- Added `Subscription` and `BillingEvent` models with indexes and idempotency
  constraints.
- Added signed webhook ingestion at
  `POST /api/v1/billing/webhooks/:provider` with duplicate-event protection.
- Added `GET /api/v1/admin/billing` for subscription status, recent billing
  events, and organization/owner visibility.
- Updated paid/free overview counts to use server-confirmed `ACTIVE` and
  `TRIALING` subscriptions instead of the organization plan label.
- Added a Billing subscription-health panel to the protected admin console.
- Added `BILLING_WEBHOOK_SECRET` to deployment configuration and examples.
- Applied the billing migration to the Neon database without resetting data.
- Verified migration status, API build/tests, and dashboard production build.

The webhook contract is intentionally provider-neutral. A future payment
provider adapter should normalize provider events into this signed endpoint;
set `BILLING_WEBHOOK_SECRET` in production before enabling external delivery.

## Execution note — Phase 3

**Status:** Completed.

Implemented the protected customer directory API:

- Added `GET /api/v1/admin/customers` with search, plan/status filters, and
  bounded pagination.
- Added search across organization name/slug, owner/member email/name, and
  website domain.
- Added owner, member count, website count, plan, status, and last-activity
  summaries.
- Added `GET /api/v1/admin/customers/:organizationId` with members, websites,
  usage event count, and last activity.
- Added audit events for customer list and detail views.
- Verified API build and all unit tests.
