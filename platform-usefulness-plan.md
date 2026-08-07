# Platform Usefulness Roadmap

## Objective

Turn the existing analytics foundation into a practical CRO decision platform that helps users identify conversion problems, understand their business impact, and take measurable action.

## Current foundation

- Anonymous visitor and live activity tracking
- Visitor timelines and visitor signals
- Overview analytics
- Funnels, forms, heatmaps, replays, and AI insights navigation
- CRO recommendations
- Webhook alerts
- Multi-website support

## Product principles

- Prioritize actionable insights over vanity metrics.
- Keep visitor data anonymous by default.
- Mask sensitive form data and respect consent settings.
- Make every recommendation traceable to observed evidence.
- Keep the free infrastructure affordable and operationally simple.

## Phases

### Phase 1 — Measurement quality and tracking health

- Add a tracking-health dashboard for each website.
- Show last event received, event volume, SDK version, origin, and connection status.
- Detect missing page views, duplicate events, blocked requests, and stale websites.
- Improve event validation and consistent metadata across the SDK.

**Done when:** users can confirm whether their data is complete and trustworthy before making CRO decisions.

### Phase 2 — Visitor explorer improvements

- Add visitor search and filtering.
- Filter by page, device, source, activity type, conversion status, and time.
- Add pagination and clear active/stale states.
- Improve activity labels for CTA clicks, forms, scrolls, and navigation.

**Done when:** users can quickly find a specific anonymous visitor and understand the visitor’s recent journey.

### Phase 3 — Funnel builder and drop-off analysis

- Create, edit, archive, and duplicate funnels.
- Support page, click, form-submit, and custom-event steps.
- Display step visitors, conversion rate, drop-off rate, and largest bottleneck.
- Add date range, website, and segment filters.
- Link funnel bottlenecks to relevant visitor and form evidence.

**Done when:** a user can define a conversion journey and identify the highest-impact abandonment step.

### Phase 4 — Form analytics

- Track form views, starts, field errors, submissions, and abandonment.
- Add field-level drop-off analysis without storing sensitive values.
- Show completion rate, error rate, abandonment rate, and average completion time.
- Identify the most problematic fields and affected pages.
- Add form-specific recommendations.

**Done when:** users can explain where and why visitors abandon important forms.

### Phase 5 — CRO insight engine

- Generate evidence-backed recommendations from funnels, forms, behaviour, and visitor activity.
- Use the required output format:
  - Problem
  - Reason
  - Confidence
  - Business impact
  - Recommendation
  - Priority
  - Expected conversion improvement
- Add evidence links to pages, events, funnels, or forms.
- Prevent recommendations when sample size is too small.
- Add dismiss, save, assign, and status tracking.

**Done when:** every insight explains what happened, why it matters, and what the user should test next.

### Phase 6 — Experiment and action tracking

- Create CRO experiments from recommendations.
- Store hypothesis, target page, variant, metric, owner, and status.
- Track planned, running, completed, and archived experiments.
- Compare baseline and post-change performance.
- Record implementation notes and outcomes.

**Done when:** users can connect an insight to an experiment and measure whether the change worked.

### Phase 7 — Alerts and automation

- Add alerts for conversion drops, form-error spikes, broken tracking, and funnel bottlenecks.
- Support webhook delivery, retry status, delivery history, and test dispatch.
- Add threshold, priority, frequency, and website filters.
- Avoid duplicate alert storms with cooldowns.

**Done when:** important CRO problems reach the team without requiring constant dashboard monitoring.

### Phase 8 — Reports and collaboration

- Add weekly and monthly performance summaries.
- Include traffic, conversion, funnel, form, and recommendation changes.
- Support read-only sharing and team comments.
- Add CSV export for analytics tables.
- Keep access controlled by organization role.

**Done when:** users can share useful CRO progress with stakeholders without manually rebuilding reports.

### Phase 9 — Privacy, retention, and governance

- Add consent configuration per website.
- Add sensitive-field masking controls and privacy audit visibility.
- Add retention settings and deletion workflows.
- Document collected event data and customer responsibilities.
- Add audit records for settings, exports, recommendations, and team access.

**Done when:** customers can understand, control, and safely manage the data collected by the platform.

### Phase 10 — Reliability and production readiness

- Add API and SDK error monitoring.
- Add background processing for expensive analytics queries.
- Add database indexes and query performance checks.
- Add rate-limit visibility and service health status.
- Add automated deployment smoke tests for tracking, authentication, analytics, and alerts.

**Done when:** the platform remains responsive and trustworthy as traffic and customer websites increase.

## Recommended execution order

1. Phase 1 — Measurement quality
2. Phase 3 — Funnels
3. Phase 4 — Form analytics
4. Phase 5 — CRO insights
5. Phase 6 — Experiments
6. Phase 7 — Alerts
7. Phase 2 — Visitor explorer improvements
8. Phase 8 — Reports and collaboration
9. Phase 9 — Privacy and governance
10. Phase 10 — Reliability and production readiness

## Success metrics

- Tracking installation verification rate
- Percentage of websites receiving valid events
- Funnel creation and weekly usage
- Form completion and error analysis usage
- Recommendation acceptance rate
- Experiments created from recommendations
- Conversion improvement measured after experiments
- Alert delivery success rate
- Weekly active organizations

## Execution rule

Each phase should have its own implementation plan, focused commits, automated verification, deployment notes, and manual visual QA before moving to the next phase.
