# Live Visitor Explorer QA Checklist

## Automated verification

- API unit tests pass.
- API TypeScript build passes.
- Dashboard production build passes.
- `git diff --check` passes.
- Live visitor contracts reject raw identifiers and oversized paths.
- Tracker runtime emits a heartbeat and preserves baseline event ordering.

## Manual two-visitor verification

1. Deploy the API and dashboard with the same `NEXT_PUBLIC_API_URL` and the live database configuration.
2. Open the tracked website in two separate browsers or one normal window and one incognito window.
3. Visit different pages in each browser and perform a CTA click in one browser.
4. Open the dashboard Overview page in a third tab.
5. Confirm both anonymous visitors appear separately in **Live visitor activity**.
6. Select visitor A and verify its current path and timeline belong to browser A.
7. Select visitor B and verify its current path and timeline belong to browser B.
8. Trigger a form start, scroll milestone, or conversion in one browser and confirm the event appears only in that visitor’s timeline.
9. Hide the dashboard tab and return after it has been hidden; confirm polling resumes without duplicate timeline events.
10. Stop activity in one browser and wait beyond the configured five-minute live window; confirm it disappears from the active list.

## Privacy checks

- Query strings and URL fragments are not shown in the visitor list or timeline.
- Raw visitor IDs and session IDs are not shown in API responses or dashboard labels.
- Form values, emails, passwords, tokens, and arbitrary sensitive metadata are not shown.
- The dashboard displays anonymous labels only; identity tracking remains intentionally disabled.

## Known limitation

The first implementation uses bounded polling rather than a paid realtime transport. A visitor may take up to the polling interval to appear or update.
