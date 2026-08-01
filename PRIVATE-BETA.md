# Private beta validation

This is the Phase 20 operating protocol for validating AI Growth with a small number of real websites. The implementation is free-stack compatible and does not require a paid analytics or monitoring provider.

## Beta entry criteria

Before inviting a website:

1. Deploy the API and dashboard from the same commit.
2. Confirm `/health`, `/health/db`, `/ready`, `/health/metrics`, and `/tracker.js`.
3. Run the beta check from the repository root:

   ```bash
   API_BASE_URL=https://api.example.com \
   DASHBOARD_URL=https://app.example.com \
   TRACKING_ID=trk_example \
   TRACKING_ORIGIN=https://customer.example.com \
   npm run beta:check --workspace @ai-growth/api
   ```

4. Confirm the dashboard uses live mode with `NEXT_PUBLIC_USE_MOCK_DATA=false`.
5. Record the website domain, tracking ID, installation date, consent mode, and source analytics baseline.

## Onboarding protocol

For each beta website:

- Create the website in the dashboard and verify the normalized domain.
- Install the generated script before `</head>` on every relevant page.
- For consent-gated sites, add `data-require-consent="true"` and call `window.aiGrowth.grantConsent()` only after consent.
- Open the exact production domain in a clean browser and use “Check connection”.
- Confirm one page view, one click, one form start/submit, and one conversion event where applicable.
- Compare the dashboard event count with the source analytics during a controlled test window; expect small differences from blockers, consent, sampling, and timezone boundaries.
- Do not use customer passwords, payment values, email addresses, or private form fields in test events.

## Activation baseline

A beta workspace is activated when all of these are true within seven days:

- A website is created.
- The tracker is installed and verified.
- At least 100 valid events or 20 unique visitors are recorded.
- At least one conversion goal or funnel is configured.
- The owner opens the overview or insights page after data arrives.

Track activation as `activated workspaces / invited workspaces`.

## Retention baseline

Use a weekly cohort sheet during beta:

| Week | Invited workspaces | Activated | Returned in week 2 | Returned in week 4 | Notes |
| --- | ---: | ---: | ---: | ---: | --- |
| YYYY-MM-DD |  |  |  |  |  |

For this MVP, a returned workspace is one whose owner signs in and views analytics or insights during the period. Set targets only after the first five to ten workspaces provide a baseline.

## Insight usefulness review

For every generated insight, ask the beta owner:

1. Was the problem understandable?
2. Was the evidence sufficient to trust it?
3. Was the recommendation actionable?
4. Did the owner make or schedule a change?
5. Did the change improve the selected conversion signal?

Record a 1–5 usefulness score, a short comment, and whether the insight was accepted, dismissed, or converted into an experiment. Never present an insight as causal proof without a controlled comparison.

## Feedback and issue severity

- P0: data leakage, incorrect tenant data, destructive privacy failure, or tracking outage for all beta sites.
- P1: wrong metrics, broken onboarding, failed conversion collection, or unusable primary dashboard flow.
- P2: inaccurate copy, layout issue, missing secondary report, or slow but recoverable flow.
- P3: polish, preferences, or future enhancement.

Pause onboarding for P0 issues. Fix or explicitly schedule P1 issues before expanding the beta group.

## Beta exit criteria

Move to Phase 21 only after:

- At least three real websites have completed installation verification.
- Event accuracy has been compared with each source analytics system.
- No P0 data-isolation or privacy issues remain.
- Activation and retention baselines are recorded.
- High-priority feedback is fixed or has an owner and due date.
