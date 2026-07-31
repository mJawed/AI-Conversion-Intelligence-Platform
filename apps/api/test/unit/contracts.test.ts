import assert from "node:assert/strict";
import test from "node:test";
import { eventSchema, maskUrl, maskValue, publicEventSummary } from "../../src/collector-routes";
import { analyticsQuerySchema, normalizeAnalyticsQuery } from "../../src/analytics-service";
import { encryptSecret } from "../../src/security";
import { normalizeDomain } from "../../src/website-routes";

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
