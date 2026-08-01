import crypto from "node:crypto";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();
const apiUrl = (process.env.API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
const dashboardUrl = (process.env.DASHBOARD_URL || "http://localhost:3000").replace(/\/$/, "");
const trackingId = process.env.TRACKING_ID || "trk_demo_acme";
const origin = process.env.TRACKING_ORIGIN || "http://demo.example.com";
const runId = crypto.randomUUID().slice(0, 8);
const visitorId = `visitor_free_smoke_${runId}`;
const sessionId = `session_free_smoke_${runId}`;
const events = [
  ["page_view", { page: "pricing" }],
  ["click", { placement: "hero_cta" }],
  ["form_start", { formId: "signup" }],
  ["form_submit", { formId: "signup" }],
  ["conversion", { goal: "signup" }],
];

async function expectOk(path, url = apiUrl) {
  const response = await fetch(`${url}${path}`);
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  return response;
}

await expectOk("/health");
await expectOk("/health/db");
await expectOk("/ready");
const metadata = await (await expectOk("/api/v1")).json();
if (metadata.infrastructure?.analyticsStorage !== "postgres" || metadata.infrastructure?.postgresEventStorageEnabled !== true) {
  throw new Error("Free MVP PostgreSQL event storage is not enabled");
}
await expectOk("/tracker.js");

const eventIds = [];
for (const [eventType, properties] of events) {
  const eventId = `evt_free_smoke_${runId}_${eventType}`;
  eventIds.push(eventId);
  const response = await fetch(`${apiUrl}/api/v1/collect`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify({
      trackingId,
      eventId,
      eventType,
      occurredAt: new Date().toISOString(),
      visitorId,
      sessionId,
      url: `${origin}/pricing`,
      title: "Pricing",
      properties,
      context: { language: "en-US", viewport: { width: 1440, height: 900 } },
    }),
  });
  if (response.status !== 202) throw new Error(`${eventType} returned HTTP ${response.status}: ${await response.text()}`);
}

const prisma = new PrismaClient();
const stored = await prisma.trackingEvent.findMany({ where: { eventId: { in: eventIds } }, select: { eventId: true, eventType: true } });
await prisma.$disconnect();
if (stored.length !== eventIds.length) throw new Error(`Expected ${eventIds.length} stored events, found ${stored.length}`);

for (const route of ["/", "/login", "/register", "/settings"]) await expectOk(route, dashboardUrl);
console.log(`Free MVP smoke check passed: ${stored.length} events persisted for ${trackingId}`);
