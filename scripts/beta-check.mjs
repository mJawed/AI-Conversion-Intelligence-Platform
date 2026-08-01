const apiUrl = (process.env.API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");
const dashboardUrl = (process.env.DASHBOARD_URL ?? "http://localhost:3000").replace(/\/$/, "");
const trackingId = process.env.TRACKING_ID;
const trackingOrigin = process.env.TRACKING_ORIGIN ?? "https://beta.example.com";

async function get(url, expected = 200) {
  const response = await fetch(url);
  if (response.status !== expected) throw new Error(`${url} returned HTTP ${response.status}; expected ${expected}`);
  return response;
}

for (const path of ["/health", "/health/db", "/ready", "/health/metrics", "/tracker.js"]) await get(`${apiUrl}${path}`);
for (const path of ["/", "/login", "/register", "/onboarding"]) await get(`${dashboardUrl}${path}`);

if (trackingId) {
  const eventId = `evt_beta_check_${Date.now()}`;
  const response = await fetch(`${apiUrl}/api/v1/collect`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: trackingOrigin },
    body: JSON.stringify({ trackingId, eventId, eventType: "page_view", occurredAt: new Date().toISOString(), visitorId: `visitor_beta_check_${Date.now()}`, sessionId: `session_beta_check_${Date.now()}`, url: `${trackingOrigin}/beta-check`, title: "Private beta check", properties: { source: "beta-check" }, context: { language: "en-US", viewport: { width: 1440, height: 900 } } }),
  });
  if (response.status !== 202) throw new Error(`Tracking check returned HTTP ${response.status}: ${await response.text()}`);
}

console.log(JSON.stringify({ status: "passed", apiUrl, dashboardUrl, tracker: "reachable", trackingEvent: trackingId ? "accepted" : "skipped (set TRACKING_ID to send one synthetic event)" }, null, 2));
