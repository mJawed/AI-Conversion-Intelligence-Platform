# AI Growth Product Focus and Validation Plan

## Product decision

AI Growth should stop expanding as a general-purpose analytics suite and focus on one job:

> Find the biggest conversion problem on a website and prove whether fixing it increased conversions.

The existing tracking, visitor, funnel, form, insight, and experiment foundations remain useful, but they should support this single outcome.

## Target customer

Start with one narrow customer profile:

- Small SaaS, WordPress, or service businesses with an important lead, signup, demo, or checkout conversion.
- A marketing owner or agency who can install one tracking script and make website changes.
- Enough traffic to produce directional evidence, but not enough analytics expertise to diagnose friction manually.

Do not optimize for every website, enterprise analytics, identity tracking, or full session-replay parity in the first validation cycle.

## Core user workflow

1. Connect a website and define one primary conversion goal.
2. Verify that page views, CTA clicks, form events, and conversions are being collected correctly.
3. See the largest conversion leak with supporting evidence.
4. Create an experiment directly from the recommendation.
5. Record the change, compare baseline and post-change results, and decide whether to keep it.

## Product principles

- Actionable evidence is more valuable than more dashboards.
- Every recommendation must explain the problem, reason, confidence, impact, priority, and expected improvement.
- Do not produce recommendations when the sample size is too small.
- Conversion goals must be explicit; generic traffic metrics are supporting evidence only.
- Keep visitor identity anonymous and privacy-safe by default.
- Prefer a reliable, narrow workflow over unfinished breadth.
- Validate each phase with real websites and real user feedback.

## Phase 1 — Product and customer validation

### Scope

- Interview 3–5 potential users or agencies.
- Choose one primary segment and one primary conversion goal.
- Document the top three CRO decisions users currently struggle to make.
- Define the minimum successful outcome for the first release.
- Remove or defer features that do not support diagnosis, action, or measurement.

### Deliverables

- One-sentence positioning statement.
- Ideal customer profile.
- Primary conversion goal specification.
- Five-question customer interview script.
- List of deferred features.

**Done when:** at least three target users confirm that conversion diagnosis and proof of improvement is a problem worth solving.

## Phase 2 — Reliable measurement foundation

### Scope

- Add a setup flow for one primary conversion goal.
- Show tracking health and goal health in one place.
- Add a test mode that confirms page view, CTA, form, and conversion events.
- Clearly distinguish real data from demo data.
- Show data freshness, event counts, and missing-signal warnings.

**Done when:** a user can verify that the numbers are trustworthy without opening browser developer tools.

## Phase 3 — Conversion diagnosis workspace

### Scope

- Build one focused diagnosis page instead of separate disconnected analytics screens.
- Show conversion rate, funnel drop-off, form friction, CTA behaviour, and top affected pages.
- Rank issues by evidence strength, affected users, business impact, and expected improvement.
- Link every issue to the underlying page, event, funnel, or form evidence.

**Done when:** a user can identify the highest-priority conversion problem in under five minutes.

## Phase 4 — Recommendation quality

### Scope

- Improve recommendation rules for small samples, conflicting signals, and duplicate issues.
- Show why an issue is ranked above another issue.
- Add confidence levels based on sample size and signal consistency.
- Use conservative improvement estimates and label them as hypotheses, not guarantees.
- Add dismiss, save, assign, and resolution workflow.

**Done when:** users understand and trust the recommendation enough to act on it.

## Phase 5 — Experiment workflow

### Scope

- Create an experiment from a recommendation with fields prefilled.
- Store hypothesis, target page, variant, primary metric, owner, status, baseline, result, and notes.
- Support planned, running, completed, and archived states.
- Add a simple before/after comparison.
- Record whether the result was positive, neutral, or negative.

**Done when:** a user can move from insight to documented website change without leaving the platform.

## Phase 6 — Proof of value

### Scope

- Show conversion change after an experiment.
- Display absolute change, relative change, sample size, and observation period.
- Add a clear “insufficient evidence” state.
- Let users mark an experiment as adopted, rejected, or still inconclusive.
- Generate a short outcome summary suitable for sharing with a client or team.

**Done when:** the platform can answer, “Did this change improve conversion, and how certain are we?”

## Phase 7 — Lightweight retention features

### Scope

- Weekly conversion health summary.
- Alerts for meaningful conversion drops or tracking failures.
- Shareable experiment and recommendation summaries.
- CSV export for evidence and outcomes.

Build these only after users repeatedly return for diagnosis and experiment measurement.

**Done when:** users have a reason to return weekly even when they are not actively investigating a problem.

## Defer until product-market evidence exists

- Broad identity resolution and logged-in user identification.
- Enterprise permissions and complex billing tiers.
- Full session replay parity with mature products.
- Large AI-generated report libraries.
- Many integrations and automation workflows.
- Advanced predictive analytics.
- Supporting every industry and conversion model at once.

## Success metrics

- Website setup completion rate.
- Percentage of websites with a verified primary conversion goal.
- Time from setup to first actionable recommendation.
- Recommendation open-to-experiment conversion rate.
- Experiments completed per active organization.
- Percentage of completed experiments with a recorded result.
- Weekly active organizations returning to review evidence.
- Number of users who can describe one conversion improvement caused by the platform.

## Execution rules

- Implement one phase at a time.
- Keep each phase in a separate focused commit series.
- Verify API, dashboard, migration, and manual visual behavior before moving on.
- Test every completed phase with at least one real website.
- Stop feature expansion if users do not understand the core value proposition.
- Revisit this plan after five customer interviews and the first five completed experiments.
