# AI Growth Tracking SDK

The AI Growth tracker is a small, first-party browser script served by the API
at `/tracker.js`. It records privacy-safe visitor and conversion signals and
sends them to `POST /api/v1/collect`.

## Install the script

Create a website in the dashboard first. Copy the generated snippet from
Onboarding or Settings and place it before the closing `</head>` tag on every
page:

```html
<script async src="http://localhost:4000/tracker.js" data-tracking-id="trk_your_id"></script>
```

The dashboard-generated snippet uses the configured `TRACKING_SCRIPT_URL`.
Do not copy a local URL into a deployed website; deployment configuration is
documented separately in [DEPLOYMENT.md](DEPLOYMENT.md).

## Supported events

The SDK automatically records:

| Event | Trigger | Data included |
| --- | --- | --- |
| `session_start` | First page load in a browser tab | Anonymous visitor/session IDs and limited browser context |
| `page_view` | Initial page and SPA history navigation | Origin and pathname, title, referrer pathname |
| `click` | Link, button, or button-like element click | Element tag, safe ID/role, destination pathname |
| `scroll` | 25%, 50%, 75%, and 100% page depth | Depth milestone |
| `form_start` | First focus in a form | Safe form ID/action/method |
| `form_submit` | Form submission | Safe form ID/action/method |

Use the global API for explicit events:

```js
window.aiGrowth.track("pricing_cta_clicked", { placement: "hero" });
window.aiGrowth.conversion({ goal: "signup" });
window.aiGrowth.flush();
```

`track("conversion", properties)` also creates a conversion event. Other
event names are recorded as `custom` events.

## Consent and privacy

Require consent before tracking by adding the script attribute:

```html
<script async src="http://localhost:4000/tracker.js"
  data-tracking-id="trk_your_id"
  data-require-consent="true"></script>
```

Call these methods from your consent-management flow:

```js
window.aiGrowth.grantConsent();
window.aiGrowth.denyConsent();
window.aiGrowth.hasConsent();
window.aiGrowth.optOut();
window.aiGrowth.optIn();
```

Do Not Track is respected by default. The SDK does not use third-party
cookies, fingerprinting, form values, query strings, URL fragments, or visible
form text. Sensitive property names are filtered in the browser and masked
again by the API.

## Local testing

Start the API:

```bash
npm run dev --workspace @ai-growth/api
```

Start the dashboard in another terminal:

```bash
npm run dev --workspace @ai-growth/dashboard
```

Serve the installation fixture from a third terminal:

```bash
python3 -m http.server 4173 --directory apps/api/test/fixtures
```

Open `http://localhost:4173/tracker-installation.html`. Replace the fixture
tracking ID with the ID of a website registered with domain `localhost`, then
visit the page and select **Check connection** in the dashboard Settings or
Onboarding screen.

Run the automated checks:

```bash
npm test --workspace @ai-growth/api
API_BASE_URL=http://localhost:4000 npm run smoke:tracker --workspace @ai-growth/api
```

## Current limitations

- RabbitMQ, Redis, and ClickHouse are disabled by default in local development.
- Full analytics persistence requires the external event pipeline services.
- Coordinate heatmaps require click coordinates, which are not collected yet.
- Full screen replay storage and playback are not enabled.
- Realtime visitors, field-level form analysis, AI generation, billing, and
  retention jobs remain separate platform work.

The SDK is complete for local installation and contract validation. Production
deployment and external service provisioning are intentionally separate.
