# AI Growth Frontend Implementation Plan

**Approach:** Frontend first, mock-data driven, API-compatible

**Goal:** Build and validate the dashboard experience in phases before connecting it to live analytics, authentication, and AI services.

## Principles

- Build one usable vertical slice at a time.
- Use realistic mock data with stable TypeScript shapes.
- Keep components reusable and accessible.
- Design for empty, loading, error, and populated states.
- Replace mock services with API calls without rewriting page components.
- Do not build advanced analytics screens before the core navigation and dashboard experience are usable.

## Phase 1 — Dashboard Foundation

### Scope

- Application shell
- Sidebar navigation
- Top navigation/header
- Responsive layout
- Website selector placeholder
- Date range filter placeholder
- Theme and visual tokens
- Loading, empty, and error state components

### Deliverable

A polished dashboard shell that works on desktop and mobile.

## Phase 2 — Overview Dashboard

### Scope

- Visitors metric
- Sessions metric
- Conversion rate metric
- Average session duration
- Bounce rate
- Realtime visitors summary
- Traffic trend chart
- Top pages list
- Recent AI insights preview
- Connect-website onboarding state

### Deliverable

An overview page that communicates the most important growth signals at a glance.

## Phase 3 — Visitor Analytics

### Scope

- Visitor list
- Visitor detail view
- Session timeline
- Current page and device
- Country, browser, and traffic source
- Session duration and scroll depth
- Visitor filtering and sorting

### Deliverable

A usable visitor and session exploration experience using mock data.

## Phase 4 — Forms Intelligence

### Scope

- Forms overview
- Completion and abandonment rates
- Field drop-off table
- Validation error breakdown
- Completion time chart
- Form detail view
- CRO recommendation panel

### Deliverable

A form analytics screen that clearly identifies friction and abandonment causes.

## Phase 5 — Funnel Analytics

### Scope

- Funnel list
- Funnel step visualization
- Conversion rate per step
- Drop-off rate per step
- Date filtering
- Segment comparison placeholder
- AI explanation panel

### Deliverable

A funnel screen that makes conversion bottlenecks easy to understand.

## Phase 6 — Behaviour Analytics

### Scope

- Click analytics
- Scroll depth visualization
- Rage-click and dead-click indicators
- Top clicked elements
- Landing and exit page summaries
- Behaviour issue cards

### Deliverable

A behaviour analytics experience focused on actionable UX problems.

## Phase 7 — Heatmaps and Session Replay

### Scope

- Heatmap viewer layout
- Page and date filters
- Click, scroll, and dead-click modes
- Session replay list
- Replay player placeholder
- Replay timeline
- AI-generated session summary panel

### Deliverable

The complete visual shell for heatmaps and session replay.

## Phase 8 — AI Insights Centre

### Scope

- Insight list
- Priority and severity filters
- Insight detail page
- Problem, reason, evidence, confidence, impact, and recommendation fields
- Status actions: open, dismissed, resolved
- Empty and loading states

### Deliverable

An AI insight centre matching the CRO analysis format defined for the product.

## Phase 9 — Settings and Website Onboarding

### Scope

- Website setup flow
- Tracking ID display
- Tracking script installation instructions
- Website settings
- Team and organization settings placeholders
- Billing settings placeholder

### Deliverable

A complete frontend onboarding path from account dashboard to website connection.

## Phase 10 — API Integration

### Scope

- Replace mock services with API client functions
- Connect authentication state
- Connect websites and organization data
- Connect analytics endpoints
- Add request loading and error handling
- Add pagination and date filters
- Add realtime data transport when backend is ready

### Deliverable

Frontend screens powered by real backend data without changing the page-level UX.

## Phase 11 — Quality and Production Readiness

### Scope

- Accessibility review
- Responsive QA
- Browser testing
- Performance optimization
- Error boundaries
- Skeleton loading polish
- Empty-state copy review
- Component documentation

### Deliverable

A stable, production-ready dashboard frontend.

## Mock Data Contract

Mock services should expose API-like functions rather than being imported directly by page components.

Example:

```ts
getOverviewMetrics({ websiteId, dateRange })
getVisitors({ websiteId, dateRange, page, filters })
getFormAnalytics({ websiteId, formId, dateRange })
getFunnelAnalytics({ websiteId, funnelId, dateRange })
getInsights({ websiteId, status, priority })
```

The response shapes should include stable fields for metrics, timestamps, labels, IDs, and pagination so they can later map directly to Express API responses.

## Phase Completion Criteria

Each phase is complete when:

- The screen is responsive.
- Populated, empty, loading, and error states exist.
- Components use typed data.
- Mock data is isolated from presentation components.
- The user can navigate to and understand the feature without backend data.
- The phase does not break previously completed screens.

## Immediate Task

Start Phase 1 by refining the dashboard shell and Overview page already scaffolded in `apps/dashboard`.

The first implementation should include:

- Shared app layout components
- Navigation structure
- Typed mock data
- Overview metric cards
- Empty onboarding state
- Responsive behavior
