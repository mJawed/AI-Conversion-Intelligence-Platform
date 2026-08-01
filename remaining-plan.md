# Remaining Implementation Plan

## Goal

Move AI Growth from a tested private-beta foundation to a production-ready public launch in small, verifiable phases.

## Current position

Completed foundations:

- Dashboard shell and core screens
- Authentication and organization permissions
- Website and tracking management
- Public event collector
- Queue, Redis, and ClickHouse integration adapters
- Analytics API foundation
- Security, privacy workflows, tests, CI, and readiness checks

The remaining work is below.

## Phase 12 — Provision production infrastructure

**Status:** Deployment automation complete; external service provisioning pending

### Scope

- Provision production PostgreSQL, RabbitMQ, Redis, and ClickHouse.
- Configure production secrets through a secrets manager.
- Apply Prisma migrations.
- Apply `apps/api/sql/events.sql` to ClickHouse.
- Configure backups, retention, network access, and service health checks.

### Completion criteria

- All services are reachable from the API deployment.
- `/health/db` and `/ready` return healthy responses.
- Database migrations and ClickHouse schema are applied successfully.
- No production secrets exist in Git or local configuration files.

## Phase 13 — Activate and harden event processing

### Scope

- Enable `EVENT_PIPELINE_ENABLED`.
- Enable Redis and ClickHouse persistence.
- Verify RabbitMQ process, retry, and dead-letter queues.
- Confirm event delivery from collector to ClickHouse.
- Add distributed rate limiting with Redis.
- Add queue-depth, retry, dead-letter, and ClickHouse failure alerts.

### Completion criteria

- A browser event is accepted, queued, processed, and queryable.
- Retry and dead-letter behavior is verified with controlled failures.
- Duplicate events do not create duplicate analytics records.
- Pipeline failure alerts are visible to operators.

## Phase 14 — Tracking SDK and onboarding completion

### Scope

- Build and host the production tracking script.
- Add automatic visitor and session identifiers.
- Add page-view, click, scroll, form, and conversion event capture.
- Add consent and opt-out controls.
- Complete onboarding website creation and installation verification.
- Add installation troubleshooting and domain management UI.

### Completion criteria

- A new customer can create a website without developer assistance.
- The script loads from the production CDN.
- The first event changes installation state to `VERIFIED`.
- Consent and opt-out behavior is documented and tested.

## Phase 15 — Connect all dashboard analytics to live APIs

### Scope

- Replace mock overview data with live overview data.
- Connect visitors and sessions.
- Connect forms analytics.
- Add funnel creation and live funnel analytics.
- Connect behaviour, heatmaps, and replays.
- Connect AI insights and empty/loading/error states.
- Add date-range, pagination, filtering, and website selection to every screen.

### Completion criteria

- Every dashboard screen works with `NEXT_PUBLIC_USE_MOCK_DATA=false`.
- No analytics page depends on mock data in production mode.
- Empty datasets render useful onboarding guidance.
- API failures show retryable user-facing states.

## Phase 16 — Funnel and conversion configuration

**Status:** Complete

### Scope

- Add funnel definition persistence.
- Add conversion goal configuration.
- Add funnel step validation.
- Add conversion event mapping.
- Add funnel analytics queries and comparison periods.
- Add permissions for creating and editing funnels.

### Delivered

- Added PostgreSQL `Funnel` and `FunnelStep` models with active/archive states.
- Added tenant-scoped funnel CRUD endpoints with role checks for
  `OWNER`, `ADMIN`, and `DEVELOPER` members.
- Added server validation for step count, duplicate paths, goal types, and
  required goal values.
- Added safe archive behavior and audit records for create, update, and archive
  operations.
- Added live PostgreSQL funnel analytics for step visitors, conversion rates,
  drop-offs, and conversion goals.
- Connected the dashboard funnel editor to live create, edit, and archive APIs.

### Completion criteria

- A user can create, edit, archive, and view a funnel.
- Funnel conversion rates match raw event data.
- Funnel queries support date ranges and segments.

## Phase 17 — AI insight generation

### Scope

- Define insight generation input contracts.
- Generate evidence-backed CRO insights from analytics signals.
- Store insight status, confidence, impact, and recommendations.
- Add insight deduplication and lifecycle management.
- Add model/provider configuration and cost controls.
- Add human-review and dismissal workflows.

### Completion criteria

- Insights contain problem, reason, confidence, business impact, recommendation, priority, and expected improvement.
- Every insight links to measurable evidence.
- Duplicate or low-confidence insights are suppressed.
- AI failures do not block analytics pages.

## Phase 18 — Privacy, retention, and compliance operations

### Scope

- Implement scheduled event retention and deletion jobs.
- Complete visitor export and deletion execution.
- Add consent records and opt-out enforcement.
- Add PII discovery and masking review.
- Document GDPR, CCPA, and India DPDP controls.
- Add privacy-policy and data-processing documentation.
- Add audit-log retention and access review.

### Completion criteria

- Export and deletion requests complete within documented timelines.
- Retention policies are enforced automatically.
- Sensitive fields are masked before persistence.
- Compliance documentation is reviewed and approved.

## Phase 19 — Production observability and reliability

### Scope

- Add structured log shipping.
- Add error monitoring and alerting.
- Add API latency and availability dashboards.
- Add database, queue, Redis, and ClickHouse monitoring.
- Add backup restore testing.
- Add incident response and rollback runbooks.
- Add load and rate-limit testing.

### Completion criteria

- Operators receive alerts for critical failures.
- Backups can be restored successfully.
- Error budgets and service-level targets are documented.
- A rollback can be completed using the runbook.

## Phase 20 — Private beta validation

### Scope

- Onboard a small group of real websites.
- Validate installation and event accuracy.
- Compare dashboard metrics with source analytics where possible.
- Collect UX and CRO feedback.
- Track activation, retention, and insight usefulness.
- Fix high-impact onboarding and analytics issues.

### Completion criteria

- Real websites send reliable events.
- No critical data-isolation or privacy issues remain.
- Activation and retention metrics have baseline targets.
- High-priority beta feedback is resolved or scheduled.

## Phase 21 — Public launch readiness

### Scope

- Final security review and dependency audit.
- Final privacy and legal review.
- Production load test.
- Final backup and restore test.
- Billing and plan enforcement review.
- Customer support and documentation readiness.
- Public launch checklist and go/no-go review.

### Completion criteria

- All critical launch risks are closed or explicitly accepted.
- Production monitoring and on-call ownership are assigned.
- Customer documentation is published.
- Go/no-go approval is recorded.

## Recommended execution order

```text
12 Infrastructure
  ↓
13 Event processing
  ↓
14 Tracking SDK and onboarding
  ↓
15 Live dashboard integration
  ↓
16 Funnels and conversion goals
  ↓
17 AI insights
  ↓
18 Privacy operations
  ↓
19 Observability and reliability
  ↓
20 Private beta
  ↓
21 Public launch
```

Each phase should produce an execution note, pass its verification criteria, and be committed separately before the next phase begins.
