const baseUrl = (process.env.API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
const response = await fetch(`${baseUrl}/tracker.js`);
const contentType = response.headers.get("content-type") || "";
const source = await response.text();

if (!response.ok) throw new Error(`/tracker.js returned HTTP ${response.status}`);
if (!contentType.includes("javascript")) throw new Error(`Unexpected content type: ${contentType}`);
for (const marker of ["session_start", "page_view", "sendBeacon", "grantConsent", "form_submit", "conversion"]) {
  if (!source.includes(marker)) throw new Error(`Tracker is missing marker: ${marker}`);
}

console.log(`Tracker smoke check passed: ${baseUrl}/tracker.js (${source.length} bytes)`);
