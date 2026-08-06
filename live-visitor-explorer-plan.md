# Live Visitor Explorer Plan

## Goal

Let an operator see which anonymous visitors are active, what each visitor is doing now, and the steps taken during the current session.

The experience should remain privacy-safe by default: visitors are represented by stable anonymous IDs unless a customer website explicitly sends a consented user identifier.

## Current gap

The Overview page currently shows the number of live visitors and a short list of recent paths. It does not provide a per-visitor activity view or a detailed live session timeline.

## Phase 1 — Live visitor contract and privacy rules

- Define the live visitor response contract.
- Define activity types: page view, navigation, click, form start, form error, form submit, scroll, conversion, and heartbeat.
- Normalize paths and remove query-string secrets from displayed URLs.
- Keep visitor and session identifiers out of public operator-facing payloads unless explicitly required by the authenticated workspace.
- Document consent, opt-out, retention, and optional `identify()` behavior.

## Phase 2 — Live visitor list API

- Add an authenticated endpoint returning active visitors for one website.
- Include anonymous visitor ID, current page, last event, last-seen time, session count, device, browser, and source when available.
- Bound the result size and apply the existing five-minute live window.
- Return an explicit empty state when no visitors are active.
- Preserve organization and website authorization.

## Phase 3 — Per-visitor session timeline API

- Add an authenticated endpoint for one visitor/session timeline.
- Return ordered, privacy-safe events with timestamps and readable labels.
- Include page transitions, CTA interactions, form progress, scroll milestones, and conversion events.
- Exclude raw form values, passwords, tokens, emails, and arbitrary sensitive properties.
- Add pagination or a bounded event limit for long sessions.

## Phase 4 — Live Visitor Explorer interface

- Replace the summary-only live card with a visitor list.
- Show status, current page, last activity, device, and source for each visitor.
- Add a detail panel opened by selecting a visitor.
- Render a live session timeline with clear event labels and timestamps.
- Add loading, empty, stale, error, and unauthorized states.

## Phase 5 — Live refresh and activity clarity

- Poll the live list and selected timeline at a bounded interval.
- Mark visitors as active, recently active, or offline based on heartbeat age.
- Highlight the newest activity without constantly reordering the operator’s selected visitor.
- Clearly display when the last refresh occurred.
- Avoid duplicate events during refreshes.

## Phase 6 — Optional consented identity

- Add a documented `window.aiGrowth.identify()` API for customer-controlled identifiers.
- Store only the minimum identifier needed for the workspace experience.
- Clearly distinguish anonymous visitors from identified visitors.
- Add consent and opt-out safeguards before accepting identity data.
- Never infer a person’s identity from analytics data.

## Phase 7 — Verification and operational readiness

- Add API contract tests for authorization, privacy masking, active-window filtering, and bounded responses.
- Add tracker tests for event ordering and heartbeat behavior.
- Verify the dashboard with two simultaneous test visitors.
- Verify navigation, CTA, form, scroll, and conversion events appear in the correct visitor timeline.
- Verify stale visitors disappear after the live window.
- Run API tests, API build, dashboard production build, and `git diff --check`.

## Deliberate limitations

- The first implementation will use the existing database and bounded polling; no paid realtime provider is required.
- Full video replay is separate from the event timeline and should only be enabled after storage, masking, consent, and retention rules are verified.
- Anonymous visitor IDs do not reveal a visitor’s real identity.

## Completion criteria

- Two simultaneous visitors appear as separate live records.
- Selecting either visitor shows their current page and recent activity.
- New page, click, form, scroll, and conversion events appear in the correct timeline.
- Visitors are removed from the active list after the configured live window.
- Sensitive values are not exposed in live visitor responses or the dashboard.
- API and dashboard verification passes.
