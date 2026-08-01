import assert from "node:assert/strict";
import test from "node:test";
import { eventSchema, maskUrl, maskValue, publicEventSummary } from "../../src/collector-routes";
import { analyticsQuerySchema, normalizeAnalyticsQuery } from "../../src/analytics-service";
import { encryptSecret } from "../../src/security";
import { getTrackingVerificationStatus, normalizeDomain } from "../../src/website-routes";
import { WebsiteStatus } from "@prisma/client";
import { trackerScript } from "../../src/tracker";
import { getPipelineMetrics, publishEvent, toClickHouseRow } from "../../src/event-pipeline";

test("normalizes website domains and rejects paths", () => {
  assert.equal(normalizeDomain("https://WWW.Example.com/"), "www.example.com");
  assert.throws(() => normalizeDomain("https://example.com/pricing"), /INVALID_DOMAIN/);
});

test("validates and masks collector events", () => {
  const event = eventSchema.parse({ trackingId: "trk_12345678", eventId: "evt_12345678", eventType: "page_view", visitorId: "visitor-1", sessionId: "session-1", url: "https://example.com/pricing?email=secret@example.com", properties: { email: "secret@example.com", cta: "Start" } });
  const summary = publicEventSummary(event);
  assert.equal(summary.url, "https://example.com/pricing");
  assert.equal((summary.properties as { email: string }).email, "[REDACTED]");
  assert.equal(maskUrl("https://example.com/?token=secret"), "https://example.com/");
  assert.deepEqual(maskValue({ nested: { password: "hidden" } }), { nested: { password: "[REDACTED]" } });
  assert.throws(() => eventSchema.parse({ ...event, eventId: "short" }));
});

test("normalizes analytics ranges and pagination", () => {
  const query = analyticsQuerySchema.parse({ organizationId: "00000000-0000-0000-0000-000000000001", websiteId: "00000000-0000-0000-0000-000000000002", limit: "10", offset: "5" });
  const context = normalizeAnalyticsQuery(query);
  assert.equal(context.limit, 10);
  assert.equal(context.offset, 5);
  assert.ok(new Date(context.from) < new Date(context.to));
});

test("encrypts API secrets without storing plaintext", () => {
  const previous = process.env.ENCRYPTION_KEY;
  process.env.ENCRYPTION_KEY = "a".repeat(64);
  const encrypted = encryptSecret("ag_live_test-secret");
  assert.notEqual(encrypted, "ag_live_test-secret");
  assert.equal(encrypted.split(":").length, 3);
  if (previous === undefined) delete process.env.ENCRYPTION_KEY; else process.env.ENCRYPTION_KEY = previous;
});

test("serves a dependency-free tracker script with automatic baseline events", () => {
  assert.match(trackerScript, /data-tracking-id/);
  assert.match(trackerScript, /session_start/);
  assert.match(trackerScript, /page_view/);
  assert.match(trackerScript, /api\/v1\/collect/);
  assert.doesNotMatch(trackerScript, /innerHTML|\.value/);
});

test("tracker script includes Phase 2 event delivery hooks", () => {
  assert.match(trackerScript, /sendBeacon/);
  assert.match(trackerScript, /pushState/);
  assert.match(trackerScript, /form_start/);
  assert.match(trackerScript, /form_submit/);
  assert.match(trackerScript, /formId/);
  assert.match(trackerScript, /scroll/);
  assert.match(trackerScript, /window\.aiGrowth/);
  assert.match(trackerScript, /keepalive/);
});

test("tracker script includes consent and privacy controls", () => {
  assert.match(trackerScript, /data-require-consent/);
  assert.match(trackerScript, /doNotTrack/);
  assert.match(trackerScript, /grantConsent/);
  assert.match(trackerScript, /denyConsent/);
  assert.match(trackerScript, /optOut/);
  assert.match(trackerScript, /optIn/);
  assert.match(trackerScript, /trackingAllowed/);
  assert.doesNotMatch(trackerScript, /FormData/);
});

test("returns clear tracking verification states", () => {
  assert.equal(getTrackingVerificationStatus({ status: WebsiteStatus.ACTIVE, firstEventAt: null }).status, "TRACKING_NOT_DETECTED");
  assert.equal(getTrackingVerificationStatus({ status: WebsiteStatus.ACTIVE, firstEventAt: new Date() }).verified, true);
  assert.equal(getTrackingVerificationStatus({ status: WebsiteStatus.PAUSED, firstEventAt: new Date() }).status, "TRACKING_PAUSED");
  assert.equal(getTrackingVerificationStatus({ status: WebsiteStatus.ARCHIVED, firstEventAt: new Date() }).status, "TRACKING_ARCHIVED");
});

test("maps tracking events to the ClickHouse schema without losing tenant identity", () => {
  const row = toClickHouseRow({ eventId: "evt_12345678", trackingId: "trk_12345678", websiteId: "website-1", eventType: "form_start", occurredAt: "2026-08-01T00:00:00.000Z", visitorId: "visitor-1", sessionId: "session-1", url: "https://example.com/signup", referrer: null, properties: { formId: "signup" }, context: { viewport: { width: 100, height: 200 } } }, new Date("2026-08-01T00:00:01.000Z"));
  assert.equal(row.website_id, "website-1");
  assert.equal(row.event_type, "form_start");
  assert.deepEqual(JSON.parse(row.properties_json), { formId: "signup" });
  assert.equal(row.ingested_at, "2026-08-01T00:00:01.000Z");
});

test("skips external publishing safely when the event pipeline is disabled", async () => {
  const previous = process.env.EVENT_PIPELINE_ENABLED;
  delete process.env.EVENT_PIPELINE_ENABLED;
  const before = getPipelineMetrics().skipped;
  await publishEvent({ eventId: "evt_12345678", trackingId: "trk_12345678", websiteId: "website-1", eventType: "page_view", occurredAt: "2026-08-01T00:00:00.000Z", visitorId: "visitor-1", sessionId: "session-1", url: "https://example.com", referrer: null, properties: {}, context: {} });
  assert.equal(getPipelineMetrics().skipped, before + 1);
  if (previous === undefined) delete process.env.EVENT_PIPELINE_ENABLED; else process.env.EVENT_PIPELINE_ENABLED = previous;
});
