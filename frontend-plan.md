# Frontend Implementation Plan

## Goal

Complete the AI Growth dashboard frontend so a user can register, onboard a website, view live analytics, configure funnels, and use AI CRO insights in a reliable production experience.

## Current position

Completed frontend foundations:

- Dashboard shell and navigation
- Overview, visitors, behaviour, heatmaps, replays, funnels, forms, insights, and settings screens
- Login page and account session context
- Website onboarding foundation
- API status and basic live account/website loading
- Mock-data fallback for local development

The remaining work is below.

## Frontend Phase 1 — Registration and authentication UX

**Status:** Complete

### Scope

- Create `/register` page.
- Connect registration to `POST /api/v1/auth/register`.
- Add client-side validation and useful API error messages.
- Add login/register navigation.
- Add logout, token refresh, expired-session handling, and protected-route behavior.
- Add password recovery placeholders or flow when the backend is available.

### Completion criteria

- A new user can register from the browser.
- Successful registration creates a session and redirects to onboarding or dashboard.
- Duplicate email, weak password, and network errors are clearly displayed.
- Authenticated pages cannot be accessed with an expired session.

## Frontend Phase 2 — Website onboarding and tracking installation

**Status:** Complete

### Scope

- Build website creation form and domain validation UI.
- Display the tracking script and copy-to-clipboard action.
- Add installation verification action and status indicator.
- Add domain management, setup instructions, and troubleshooting states.
- Show useful empty states when no website exists.

### Completion criteria

- A user can create and select a website without API requests outside the UI.
- The tracking snippet is available with safe copy behavior.
- Installation status changes between pending, verified, and failed states.
- The user always knows the next onboarding action.

## Frontend Phase 3 — Live overview analytics

**Status:** Complete

### Scope

- Replace overview mock metrics with the analytics API.
- Connect website selector and date-range selector.
- Connect visitor trend chart and summary cards.
- Add loading, empty, error, and retry states.
- Preserve mock mode only when explicitly enabled for local development.

### Completion criteria

- Overview works with `NEXT_PUBLIC_USE_MOCK_DATA=false`.
- Metrics update when website or date range changes.
- API failures do not break the dashboard shell.
- Empty datasets provide onboarding guidance.

## Frontend Phase 4 — Visitors, behaviour, forms, and sessions

**Status:** Complete

### Scope

- Connect visitors and sessions pages to live analytics endpoints.
- Connect behaviour and page-performance views.
- Connect forms analytics, submissions, completion, and abandonment views.
- Add pagination, sorting, filters, and date ranges where supported.
- Add detail drawers or drill-down links where useful.

### Completion criteria

- Each screen renders live API data and supports its documented filters.
- Tables and charts handle large, empty, and partial datasets.
- All query failures have retryable UI states.

## Frontend Phase 5 — Heatmaps and replays

**Status:** Complete

### Scope

- Connect heatmap filters to live data.
- Add page, device, and date-range selection.
- Connect replay list and replay detail state.
- Add unavailable-data, processing, and privacy notices.
- Prevent replay and visitor data from being exposed across organizations.

### Completion criteria

- Heatmap and replay screens clearly distinguish available, processing, and unavailable data.
- Filters remain synchronized with API requests.
- Privacy-sensitive states are visible and understandable.

## Frontend Phase 6 — Funnel and conversion configuration

**Status:** Complete

### Scope

- Build funnel list, create, edit, archive, and detail flows.
- Add funnel-step and conversion-goal configuration UI.
- Validate duplicate, incomplete, and invalid steps.
- Connect funnel analytics and comparison periods.
- Add permission-aware controls for organization members.

### Completion criteria

- A user can manage a funnel entirely from the frontend.
- Funnel conversion rates and drop-offs render from live data.
- Invalid configuration is blocked before submission.
- Permission errors are shown without breaking navigation.

## Frontend Phase 7 — AI insights experience

**Status:** Complete as an insights UI foundation

### Scope

- Connect the insights page to the live insights API.
- Display problem, reason, confidence, business impact, recommendation, priority, and expected improvement.
- Add evidence and supporting metric links.
- Add filtering, sorting, dismissal, resolution, and review states.
- Add AI unavailable, generating, and failed states.

### Completion criteria

- Every insight is presented with measurable evidence.
- Users can filter and update insight status.
- AI failures do not block analytics access.
- Low-confidence or incomplete insights are clearly labelled.

## Frontend Phase 8 — Settings, privacy, and account operations

### Scope

- Complete profile and organization settings.
- Add API-key management UI with one-time secret display.
- Add audit-log view.
- Add export and deletion request flows.
- Add consent, privacy, and data-retention explanations.

### Completion criteria

- Sensitive secrets are never shown after their one-time display.
- Destructive privacy actions require confirmation.
- Request status and audit history are visible.
- Organization permissions are respected.

## Frontend Phase 9 — Quality, accessibility, and production polish

### Scope

- Responsive layouts for desktop, tablet, and mobile.
- Keyboard navigation and visible focus states.
- Screen-reader labels for charts, controls, and status indicators.
- Consistent loading skeletons, empty states, and error boundaries.
- Visual regression and browser smoke testing.
- Performance review for charts, tables, and replay views.

### Completion criteria

- Core flows work at supported viewport sizes.
- Critical controls are keyboard accessible.
- No page relies on raw browser errors for user feedback.
- Production build and browser smoke checks pass.

## Recommended execution order

```text
1 Registration and authentication
        ↓
2 Website onboarding and tracking
        ↓
3 Live overview analytics
        ↓
4 Visitors, behaviour, forms, sessions
        ↓
5 Heatmaps and replays
        ↓
6 Funnels and conversion goals
        ↓
7 AI insights
        ↓
8 Settings and privacy
        ↓
9 Quality and production polish
```

Each phase should produce an execution note, pass its completion criteria, and be committed separately before the next phase begins.
