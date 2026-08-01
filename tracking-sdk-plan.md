# AI Growth Tracking SDK Implementation Plan

## Objective

Build the first-party browser tracking SDK and serve it from the API at
`/tracker.js`. The SDK must collect privacy-safe visitor and conversion events
from an installed website, send them to the public collector endpoint, and make
the first-event verification flow work locally before deployment is discussed.

This plan covers SDK implementation and local validation only. Hosting,
domains, tunnels, production secrets, and external-service provisioning are
out of scope until this plan is complete.

## Current state

- The dashboard can request a tracking snippet for a website.
- The API accepts validated events at `POST /api/v1/collect`.
- The collector validates tracking IDs, checks the website domain, masks
  sensitive values, rate-limits requests, and de-duplicates event IDs.
- The API currently references `/tracker.js`, but does not serve the SDK yet.
- Event persistence is behind the RabbitMQ, Redis, and ClickHouse pipeline flags.

## Design decisions

- Use a small dependency-free browser SDK served as JavaScript from the API.
- Read the tracking ID from the script's `data-tracking-id` attribute.
- Generate anonymous visitor and session identifiers in browser storage; do not
  collect names, email addresses, phone numbers, cookies, or form values.
- Send events with `navigator.sendBeacon` when available and fall back to
  `fetch` with `keepalive`.
- Batch low-priority events, flush on page hide, and avoid blocking page load.
- Keep the SDK API intentionally small: automatic page views plus explicit
  `track`, `identify`-free conversion, and consent controls.
- Treat the server collector as the source of truth for validation, masking,
  origin checks, rate limits, and persistence.

## Phase 1 — SDK runtime and `/tracker.js` serving

**Status:** Complete as an initial browser SDK foundation

### Scope

- Add a browser-safe SDK source under the API workspace.
- Serve it from `GET /tracker.js` with JavaScript content type and cache headers.
- Read and validate the tracking ID from the installation script tag.
- Resolve the collector URL from the script origin without hard-coded local URLs.
- Generate stable anonymous visitor and session IDs with safe fallbacks when
  storage is unavailable.
- Automatically emit `session_start` and the initial `page_view`.

### Completion criteria

- `curl http://localhost:4000/tracker.js` returns executable JavaScript.
- The script loads without a console error on a plain HTML test page.
- The initial page view reaches the collector with the correct tracking ID.
- No personal form or URL query data is sent by default.

### Delivered

- Added a dependency-free browser SDK served from `GET /tracker.js`.
- Added anonymous local visitor and tab session identifiers with storage fallbacks.
- Added automatic `session_start` and initial `page_view` events.
- Added safe URL/referrer normalization and limited browser context metadata.
- Added `sendBeacon` delivery with `fetch keepalive` fallback.
- Added cache headers and unit coverage for the served SDK contract.
- Configured the SDK response for cross-origin script loading from an installed website.

## Phase 2 — Event capture and delivery

**Status:** Complete as a browser event-capture foundation

### Scope

- Add SPA-safe page-view tracking for `history.pushState`, `replaceState`, and
  `popstate`.
- Add click tracking with privacy-safe target metadata.
- Add scroll-depth milestones without sending page content.
- Add form start and form submit events without field values.
- Add explicit conversion and custom-event methods.
- Add batching, retry limits, payload size limits, and page-hide flushing.
- Preserve the existing collector event contract.

### Completion criteria

- Supported events are emitted once per intended browser action.
- Duplicate browser events do not create duplicate collector events.
- Network failures do not break the host website or create infinite retries.
- Event payloads remain within the API validation and privacy limits.

### Delivered

- Added queued delivery with timed flushes, size-based flushes, and page-hide flushes.
- Added SPA page-view tracking for history changes and browser navigation.
- Added privacy-safe click metadata for links, buttons, and button-like elements.
- Added scroll-depth milestones at 25%, 50%, 75%, and 100%.
- Added form-start and form-submit events without field values.
- Added `window.aiGrowth.track`, `window.aiGrowth.conversion`, and `window.aiGrowth.flush`.
- Added API contract tests for the Phase 2 browser hooks.

## Phase 3 — Consent and privacy safeguards

**Status:** Complete as a browser privacy-control foundation

### Scope

- Add opt-in/opt-out behavior through a small global SDK API.
- Support a configurable consent requirement without silently tracking before
  consent is granted.
- Add `doNotTrack` handling and a persistent local opt-out state.
- Ensure sensitive keys, input values, hashes, query strings, and fragments are
  excluded before events leave the browser.
- Document the SDK's data collection and consent behavior.

### Completion criteria

- Tracking can be disabled before initialization and at runtime.
- No event is sent while consent is required but unavailable.
- Sensitive data is excluded in browser-generated payloads and server masking
  remains active as defense in depth.
- The SDK does not use third-party cookies or fingerprinting.

### Delivered

- Added `data-require-consent="true"` support for consent-gated installations.
- Added `window.aiGrowth.grantConsent()`, `denyConsent()`, `hasConsent()`,
  `optOut()`, and `optIn()` controls.
- Added persistent local opt-out state and Do Not Track handling.
- Added browser-side filtering of sensitive property names and values.
- Preserved query-string and fragment exclusion from URLs and referrers.
- Added contract tests for consent and privacy controls.

## Phase 4 — Tracking verification integration

**Status:** Complete as a tracking installation and verification foundation

### Scope

- Make the onboarding and Settings installation snippets use the served SDK.
- Ensure verification accepts the first valid event from the registered domain.
- Return clear states for not installed, receiving events, paused, and archived
  websites.
- Add a local test page or documented HTML fixture for installation testing.
- Add a safe configuration endpoint if the SDK needs non-secret website options.

### Completion criteria

- A locally served test page can install the snippet and send a first event.
- `Check connection` changes to verified after the first accepted event.
- Invalid tracking IDs and unauthorized origins are rejected.
- Paused and archived websites do not collect events.

### Delivered

- Added explicit API verification states for pending, verified, paused, and archived websites.
- Added website status to tracking-script configuration responses.
- Preserved domain matching and invalid-domain protection in verification.
- Prevented paused and archived websites from reporting as verified.
- Updated Settings installation UI with status-aware badges and controls.
- Preserved first-event timestamps while updating last-event activity.
- Added contract tests for all verification states.

## Phase 5 — Persistence and analytics handoff

**Status:** Complete as a persistence and analytics handoff foundation

### Scope

- Confirm the SDK's events flow through the existing pipeline without changing
  the public collector contract.
- Add or update tests for disabled-pipeline behavior and enabled-pipeline
  handoff.
- Validate ClickHouse row mapping for page views, sessions, forms, clicks,
  scrolls, and conversions.
- Confirm analytics endpoints return the events under the correct organization
  and website scope.

### Completion criteria

- Accepted events are observable in pipeline health metrics.
- Persisted events are queryable by the dashboard analytics endpoints when the
  required services are enabled.
- Organization isolation and website isolation remain intact.
- Failed persistence is retried or dead-lettered without falsely reporting
  successful analytics.

### Delivered

- Aligned browser form metadata with analytics queries using `formId`.
- Centralized and tested ClickHouse row mapping for all event fields.
- Preserved tracking ID and website ID through the persistence handoff.
- Kept disabled-pipeline behavior safe for local development.
- Preserved RabbitMQ retry and dead-letter behavior for persistence failures.
- Confirmed analytics authorization scopes every website query through its
  organization membership before ClickHouse access.

## Phase 6 — Test coverage and browser validation

**Status:** Complete as a local browser-validation foundation

### Scope

- Add unit tests for ID generation, consent, sanitization, batching, and event
  normalization.
- Add API tests for `/tracker.js`, collector acceptance, origin rejection,
  invalid payloads, duplicates, rate limits, and website status handling.
- Add a browser smoke fixture that loads the script and records requests.
- Add local commands for SDK checks and a documented manual test workflow.
- Run dashboard and API type checks, lint, builds, and integration checks.

### Completion criteria

- SDK unit and API contract tests pass.
- Browser fixture proves automatic page view and explicit conversion events.
- Existing dashboard smoke checks remain green.
- No new dependency or generated build artifact is committed accidentally.

### Delivered

- Added a Node VM browser-runtime harness for automatic and explicit SDK events.
- Covered clicks, forms, scroll milestones, conversions, SPA navigation, and
  consent/opt-out behavior.
- Added a static installation fixture at
  `apps/api/test/fixtures/tracker-installation.html`.
- Added `npm run smoke:tracker --workspace @ai-growth/api` for live route checks.
- Kept validation dependency-free and suitable for local development.

## Phase 7 — Documentation and handoff

**Status:** Complete

### Scope

- Update onboarding copy and installation instructions.
- Document the supported SDK API and event names.
- Document local testing with a static HTML page.
- Record privacy limitations and unsupported replay/heatmap capabilities.
- Add an execution note for every completed phase.

### Completion criteria

- A developer can install the local snippet without reading source code.
- A developer can send a test conversion and receive an accepted collector response;
  analytics visibility is available when the persistence services are enabled.
- Deployment prerequisites are clearly separated from SDK completion.

### Delivered

- Added [TRACKING-SDK.md](TRACKING-SDK.md) with installation, event, consent,
  privacy, local testing, and limitation guidance.
- Linked the SDK handoff documentation from the project README.
- Updated Onboarding and Settings installation copy with consent guidance.
- Documented the static local fixture and tracker smoke command.
- Documented the separation between SDK completion and production provisioning.

## Recommended execution order

```text
1 SDK runtime and /tracker.js
        ↓
2 Event capture and delivery
        ↓
3 Consent and privacy safeguards
        ↓
4 Tracking verification integration
        ↓
5 Persistence and analytics handoff
        ↓
6 Test coverage and browser validation
        ↓
7 Documentation and handoff
```

Each phase should be implemented, verified, documented in `execution-notes.md`,
and committed separately before moving to the next phase.
