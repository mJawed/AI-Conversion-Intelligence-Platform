# Unified CRO Recommendations Plan

## Goal

Combine funnel, form, behaviour, page-conversion, and visitor-session signals into one prioritized CRO recommendation system that helps an operator decide what to fix next.

The implementation will remain deterministic, explainable, privacy-safe, and free to operate. No paid AI provider is required.

## Product outcome

For every recommendation, the dashboard should clearly show:

- Problem
- Reason
- Evidence
- Confidence
- Business impact
- Recommendation
- Priority
- Expected conversion improvement

Recommendations must be tenant-scoped, deduplicated, reviewable, and safe when one analytics source has no data.

## Phase 26.1 — Unified signal contract

**Status:** Complete

### Scope

- Define the internal recommendation input and output types.
- Normalize evidence from overview, page conversion, funnels, forms, behaviour, and visitor timelines.
- Define stable fingerprints for deduplication.
- Define category, priority, confidence, and expected-improvement conventions.
- Document how missing or insufficient data is handled.

### Completion criteria

- All recommendation rules use one shared contract.
- Evidence is measurable and traceable to an analytics signal.
- Duplicate recommendations cannot be created for the same website and issue.
- No recommendation is generated from an insufficient sample.

## Phase 26.2 — Recommendation rule engine

**Status:** Complete

### Scope

Add deterministic recommendation rules for:

- Funnel step drop-offs and bottlenecks.
- Form abandonment and validation-error friction.
- Rage-click candidates and unlinked/dead-click candidates.
- Low-scroll pages with meaningful traffic.
- High-traffic pages with no recorded conversion.
- High-exit or weak landing-page journeys when evidence is sufficient.

Each rule must include a problem statement, reason, evidence, confidence, impact, recommendation, priority, and expected improvement.

### Completion criteria

- Rules produce actionable recommendations from live PostgreSQL analytics.
- Recommendations are sorted by business impact and priority.
- Rules remain explainable without an external model.
- Empty datasets return no false-positive recommendations.

## Phase 26.3 — Persist and refresh recommendations

**Status:** Complete

### Scope

- Extend the existing insight generator to consume all normalized signals.
- Upsert recommendations using stable website-scoped fingerprints.
- Refresh evidence and recommendation text when analytics change.
- Preserve open, dismissed, and resolved status workflows.
- Prevent stale or duplicate records from flooding the insights list.

### Completion criteria

- Existing insight lifecycle actions continue to work.
- Re-running generation is idempotent.
- A recommendation can be traced to its source page, form, funnel, or behaviour signal.
- One failing signal source does not break the complete insights endpoint.

## Phase 26.4 — Insights Centre experience

**Status:** Complete

### Scope

- Display the unified recommendation feed in the existing Insights Centre.
- Add source/category labels for funnel, form, behaviour, content, and UX findings.
- Show evidence and affected page/entity where available.
- Add filtering by priority, category, status, and source.
- Preserve loading, empty, error, and retry states.

### Completion criteria

- Operators can identify the highest-value issue quickly.
- Every card includes the CRO analysis fields requested for the product.
- Filters and status actions work with live API data.
- The page remains usable when there are no insights.

## Phase 26.5 — Verification and operational readiness

**Status:** Complete

### Scope

- Add unit tests for every recommendation rule.
- Add deduplication and idempotency tests.
- Add API contract tests for evidence and privacy-safe output.
- Run API tests, TypeScript builds, dashboard production build, and `git diff --check`.
- Add execution notes with known limitations and sample-size thresholds.

### Completion criteria

- All automated checks pass.
- No visitor identifiers or sensitive form values appear in recommendation responses.
- Recommendation generation remains free of paid infrastructure dependencies.
- Changes are committed in focused commits and pushed to `main`.

## Planned commit boundaries

1. `feat(insights): define unified cro recommendation contract`
2. `feat(insights): generate cross-signal cro recommendations`
3. `feat(insights): persist and deduplicate unified recommendations`
4. `feat(dashboard): improve unified insights experience`
5. `test(insights): verify recommendation rules and privacy contracts`
6. `docs(phase-26): record unified recommendations completion`

## Known limitations

- Recommendations are evidence-based heuristics, not autonomous marketing decisions.
- Country and geographic insights remain unavailable until a privacy-approved geolocation strategy is added.
- Expected conversion improvement is an estimated range based on issue severity and signal strength, not a guarantee.
- Live recommendations depend on the tracking SDK being installed correctly and events reaching the deployed API.
