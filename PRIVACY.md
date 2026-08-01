# Privacy and data operations

This document describes the privacy controls currently implemented in the AI Growth platform. It is an operational baseline for the MVP, not legal advice or a substitute for a jurisdiction-specific privacy notice and legal review.

## Data inventory

- Account and workspace data: names, email addresses, organization settings, subscription state, and authentication metadata.
- Analytics data: pseudonymous visitor and session identifiers, page paths, referrers, device and geographic context, event timestamps, and event properties.
- Consent data: the latest consent status for a website and visitor when the tracker receives `consent_granted`.
- Operational records: privacy requests and audit logs used to demonstrate administrative actions.

Passwords, access tokens, API keys, payment secrets, and raw form values are not accepted as tracking properties. Collector-side masking removes sensitive keys and the tracker avoids collecting input values and visible text.

## Retention and deletion

Tracking events and consent records are removed by the scheduled cleanup command after `EVENT_RETENTION_DAYS` (30 days by default, bounded by the API configuration). Run it from the repository root:

```bash
npm run db:cleanup:events --workspace @ai-growth/api
```

The command is safe to run repeatedly and should be scheduled by the deployment environment. Privacy deletion requests can be moved to `PROCESSING` by a platform administrator and processed with:

```bash
npm run privacy:process --workspace @ai-growth/api
```

Completing a `DELETE` request removes the organization’s tracking events, consent records, generated insights, and funnels. It intentionally does not delete the account, organization, billing, or audit history; those records require a separate retention and legal policy decision.

## Consent and opt-out

Consent-gated installations use `data-require-consent="true"` and call `window.aiGrowth.grantConsent()` only after consent. The tracker supports `grantConsent()`, `denyConsent()`, and `optOut()`. Do Not Track is respected by default. After opt-out or denial, new analytics events are not sent.

## Rights operations

Authenticated users can request an organization export or deletion through the privacy API. Exports exclude credential-like fields and deletion requests are recorded for controlled administrative processing. Platform administrators can review requests, audit activity, usage, organizations, and subscription status from the admin console.

## GDPR, CCPA, and India DPDP readiness

The implementation provides practical controls for access/export, deletion workflow, consent capture, opt-out, data minimization, tenant isolation, masking, and auditability. Before production launch, the operator must still establish the applicable privacy notice, lawful basis and consent language, processor agreements, cross-border transfer disclosures, rights-request timelines, breach response, cookie disclosures, and India DPDP-specific notices/consents where applicable.

## Access and audit review

Privacy request changes, exports, deletion completion, admin reports, and audit-log access are recorded in `audit_logs`. Access is restricted to authenticated organization members or platform administrators according to the route. Audit-log retention and access should be reviewed periodically and aligned with the operator’s legal, security, and incident-response requirements.
