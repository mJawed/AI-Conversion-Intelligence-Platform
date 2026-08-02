# Live tracking plan

## Objective

Show recent visitor activity and active visitor counts in the dashboard using the existing PostgreSQL tracking events, without adding paid infrastructure.

## Recommended architecture

Use short-interval polling rather than WebSockets or Redis for the free MVP:

```text
Website tracker
  ↓
POST /api/v1/collect
  ↓
PostgreSQL tracking_events
  ↓
GET live analytics endpoint every 10–15 seconds
  ↓
Dashboard live activity widgets
```

This provides practical near-real-time visibility while keeping deployment simple and compatible with the free Neon/Render stack.

## Phase 1 — Live activity API

**Status:** In progress

The first API implementation is being added at `GET /api/v1/analytics/live`.

- Add an authenticated, organization-scoped live activity endpoint.
- Return active visitors based on recent events within a configurable activity window.
- Return recent events with event type, page path, timestamp, and privacy-safe metadata.
- Return `lastUpdatedAt`, activity window, and whether the data is delayed or unavailable.
- Enforce website and organization authorization.
- Limit page size and query range to protect PostgreSQL.

### API response target

```json
{
  "live": {
    "activeVisitors": 3,
    "recentEvents": [],
    "lastUpdatedAt": "2026-08-02T12:00:00.000Z",
    "activityWindowSeconds": 300
  }
}
```

## Phase 2 — Dashboard live widgets

**Status:** Complete as a live activity widget foundation

- Connected Overview to `GET /api/v1/analytics/live`.
- Added live visitor count, recent activity rows, activity window, and last-updated label.
- Added loading, empty, unavailable, and retry states.

- Replace the current “Realtime tracking is not enabled” state when live data is available.
- Add active visitor count to Overview.
- Add a recent activity feed with page views, clicks, forms, and conversions.
- Add a live status indicator and last-updated time.
- Add loading, empty, stale, API-error, and disconnected states.
- Keep the existing mock-data experience unchanged when mock mode is enabled.

## Phase 3 — Polling and freshness behavior

**Status:** Complete as a resilient polling foundation

- Prevented overlapping live requests.
- Paused refresh while the tab is hidden and resumed on visibility.
- Stopped polling after three consecutive failures and exposed manual retry.
- Added stale status when the last live response can no longer be refreshed.

- Poll every 15 seconds while the page is visible.
- Pause polling when the browser tab is hidden.
- Refresh immediately when the tab becomes visible again.
- Stop polling after repeated API failures and show a retry action.
- Do not create overlapping requests.
- Use the selected website and date context consistently.

## Phase 4 — Privacy and performance safeguards

- Never expose email addresses, form values, passwords, tokens, or visible text.
- Reuse the existing URL and property masking rules.
- Return only aggregate active visitor counts and limited recent activity.
- Cap returned events, use indexed timestamp/website queries, and avoid polling every page.
- Respect website status and tenant authorization.
- Ensure live activity follows retention and deletion behavior.

## Phase 5 — Testing and verification

- Add API tests for tenant isolation, website filtering, activity-window boundaries, and empty results.
- Add dashboard tests for polling, pause/resume, stale state, and retry behavior.
- Verify events appear after a real website page view and CTA click.
- Verify the count falls after the activity window expires.
- Run the free beta check and compare recent activity with browser Network events.
- Confirm no sensitive fields appear in API responses or browser logs.

## Phase 6 — Optional later upgrade

Only if polling becomes insufficient at higher traffic:

- Consider Server-Sent Events or WebSockets.
- Consider Redis for shared active-visitor state.
- Add these only after measuring database load and user demand; they are not required for the free MVP.

## Completion criteria

- A real visitor event appears in the dashboard within approximately 15 seconds.
- Active visitor count is tenant- and website-scoped.
- Recent activity is privacy-safe and retention-compatible.
- Polling pauses when hidden and recovers when visible.
- Empty, stale, unavailable, and loading states are understandable.
- API, dashboard, and production builds pass.

## Rollout order

1. Implement and verify the live activity API.
2. Connect Overview live widgets.
3. Add polling and freshness states.
4. Test with the current beta website.
5. Validate with at least three beta websites before considering a streaming upgrade.
