# Phase 27 — CRO Alerts Plan

## Goal

Give operators a clear in-dashboard alert queue for new or updated high-priority CRO recommendations without requiring paid email, Slack, or queue infrastructure.

## Delivered in this phase

- Derive alerts from open, high-priority persisted insights.
- Return a bounded, privacy-safe alert payload from the Insights API.
- Display alert count, affected source/page, and review action in the Insights Centre.
- Preserve existing insight status workflows and tenant authorization.

## Deliberate limitation

This phase does not send external email or Slack messages. External delivery should be added later as an optional webhook/email adapter with retry, secret storage, rate limits, and consent controls.

## Completion criteria

- High-priority open insights appear as alerts.
- Resolved and dismissed insights do not appear in the active alert queue.
- Alert payloads contain no visitor identifiers or sensitive form values.
- The alert queue is bounded and works when no alerts exist.
- API tests and dashboard production build pass.

## Phase 28 — Optional free webhook delivery

**Status:** Complete as a manual, encrypted, in-dashboard delivery adapter

- Added organization-level webhook endpoint management for owner/admin users.
- Added website-level alert enablement and minimum-priority preferences.
- Encrypted webhook URLs at rest and rejected localhost/private-network targets.
- Added test delivery and manual “dispatch now” actions from Settings → Alerts.
- Added idempotent delivery records, response status, and last-delivery metadata.
- Kept delivery payloads privacy-safe and limited to CRO insight context.
- No paid email/Slack provider, background scheduler, or external queue was introduced.
- API tests, API build, dashboard production build, and diff validation passed.
