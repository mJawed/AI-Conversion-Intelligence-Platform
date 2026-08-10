import assert from "node:assert/strict";
import test from "node:test";
import { eventSchema, maskUrl, maskValue, publicEventSummary, toTrackingEventData } from "../../src/collector-routes";
import { analyticsQuerySchema, liveAnalyticsQuerySchema, normalizeAnalyticsQuery, toLiveEvent, toLiveVisitor, toLiveVisitorActivity } from "../../src/analytics-service";
import { decryptSecret, encryptSecret } from "../../src/security";
import { safeWebhookUrl } from "../../src/alert-routes";
import { getTrackingHealthStatus, getTrackingVerificationStatus, normalizeDomain } from "../../src/website-routes";
import { WebsiteStatus } from "@prisma/client";
import { TRACKER_VERSION, trackerScript } from "../../src/tracker";
import { getPipelineMetrics, publishEvent, toClickHouseRow } from "../../src/event-pipeline";
import { getInfrastructureConfig, getMaxTrackingEventsPerDay, getEventRetentionDays, getAnalyticsStorage, isFreeMvpMode } from "../../src/config";
import { createCROFingerprint, hasCROSample, normalizeCROEvidence, normalizeCROPath, normalizeCRORecommendation } from "../../src/cro-recommendations";
import { buildCRORecommendations } from "../../src/cro-recommendation-rules";
import { buildAIRecommendationEvidence } from "../../src/ai-recommendation-evidence";
import { liveActivityTypeSchema, liveActivityLabel, liveVisitorActivitySchema, liveVisitorSummarySchema, normalizeLivePath, sanitizeLiveMetadata, toAnonymousVisitorLabel, toLiveActivityType } from "../../src/live-visitor-contract";
import { funnelStepSchema } from "../../src/funnel-routes";

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

test("validates typed funnel steps while preserving page-view defaults", () => {
  assert.equal(funnelStepSchema.parse({ name: "Pricing", path: "/pricing" }).type, "page_view");
  assert.equal(funnelStepSchema.parse({ name: "CTA", path: "/pricing", type: "click", value: "start-trial" }).value, "start-trial");
  assert.throws(() => funnelStepSchema.parse({ name: "CTA", path: "/pricing", type: "click" }));
});

test("normalizes unified CRO recommendation contracts", () => {
  assert.equal(normalizeCROPath("https://example.com/pricing/?utm_source=test#plans"), "/pricing/");
  assert.equal(normalizeCROPath("pricing?variant=b"), "/pricing");
  assert.equal(createCROFingerprint("form", "abandonment", "signup"), "cro:form:abandonment:signup");
  assert.equal(hasCROSample("formStarts", 9), false);
  assert.equal(hasCROSample("formStarts", 10), true);

  const evidence = normalizeCROEvidence([
    { source: "form", metric: "  Starts ", value: "10 starts" },
    { source: "form", metric: "Starts", value: "10 starts" },
  ]);
  assert.equal(evidence.length, 1);
  assert.equal(evidence[0]?.metric, "Starts");

  const recommendation = normalizeCRORecommendation({
    source: "page",
    rule: "no-conversion",
    entity: "/pricing",
    category: "Content",
    priority: "Medium",
    title: "  Pricing page needs a clearer next step  ",
    page: "https://example.com/pricing?utm=campaign",
    problem: "  Visitors do not reach a measurable conversion. ",
    reason: "The page receives meaningful traffic without a conversion signal.",
    evidence,
    confidence: "Medium",
    businessImpact: "Existing demand may be under-converting.",
    recommendation: "Clarify the primary CTA.",
    expectedImprovement: "+3–8% relative",
  });
  assert.equal(recommendation.fingerprint, "cro:page:no-conversion:pricing");
  assert.equal(recommendation.page, "/pricing");
  assert.equal(recommendation.title, "Pricing page needs a clearer next step");
});

test("generates unified CRO recommendations only when samples are sufficient", () => {
  const recommendations = buildCRORecommendations({
    overview: { visitors: 30, conversions: 2, conversionRate: 6.67 },
    forms: [{ form_id: "signup", path: "/signup", started: 20, completed: 8, errors: 6, completionRate: 40 }],
    funnels: [{ id: "funnel-1", name: "Signup", totalVisitors: "20", conversions: "3", steps: [{ name: "Landing", path: "/", visitors: "20", dropOff: "0%" }, { name: "Signup", path: "/signup", visitors: "8", dropOff: "60%" }] }],
    behaviour: { issues: [{ type: "Rage click", title: "Repeated clicks", page: "/pricing", detail: "12 clicks across 10 visitors were clustered within short intervals.", impact: "+3–7%", priority: "High" }], scrollPages: [] },
    pages: [{ path: "/pricing", visitors: 12, page_views: 24, conversions: 0 }],
  });
  assert.equal(recommendations.length, 4);
  assert.ok(recommendations.some((item) => item.source === "funnel" && item.priority === "High"));
  assert.ok(recommendations.some((item) => item.source === "form"));
  assert.ok(recommendations.some((item) => item.source === "behaviour"));
  assert.ok(recommendations.some((item) => item.source === "page"));
  assert.equal(buildCRORecommendations({ overview: { visitors: 1, conversions: 0, conversionRate: 0 }, forms: [{ form_id: "signup", started: 9, completed: 0, errors: 9, completionRate: 0 }], funnels: [{ id: "funnel-1", name: "Signup", totalVisitors: "9", conversions: "0", steps: [{ name: "Landing", path: "/", visitors: "9", dropOff: "0%" }, { name: "Signup", path: "/signup", visitors: "1", dropOff: "88%" }] }], behaviour: { issues: [{ type: "Rage click", title: "Repeated clicks", page: "/", detail: "3 clicks across 2 visitors were clustered within short intervals.", impact: "+3–7%", priority: "High" }], scrollPages: [] }, pages: [{ path: "/", visitors: 9, page_views: 19, conversions: 0 }] }).length, 0);
});

test("prepares bounded evidence packets for future AI recommendations", () => {
  const recommendations = buildCRORecommendations({
    overview: { visitors: 40, conversions: 0, conversionRate: 0 },
    forms: [{ form_id: "signup", path: "/signup", started: 20, completed: 8, errors: 6, completionRate: 40 }],
    funnels: [],
    behaviour: { issues: [], scrollPages: [] },
    pages: [],
  });
  const packets = buildAIRecommendationEvidence(recommendations);
  assert.equal(packets.length, 1);
  assert.equal(packets[0]?.sampleSize, 20);
  assert.equal(packets[0]?.readyForAI, true);
  assert.equal("visitorId" in packets[0]!, false);
  assert.ok(packets[0]?.evidence.length <= 8);
});

test("deduplicates unified CRO recommendation fingerprints", () => {
  const input = {
    overview: { visitors: 30, conversions: 0, conversionRate: 0 },
    forms: [],
    funnels: [],
    behaviour: { issues: [], scrollPages: [] },
    pages: [
      { path: "/pricing", visitors: 12, page_views: 24, conversions: 0 },
      { path: "/pricing?utm_source=test", visitors: 12, page_views: 24, conversions: 0 },
    ],
  };
  const recommendations = buildCRORecommendations(input);
  assert.equal(recommendations.length, 1);
  assert.equal(new Set(recommendations.map((item) => item.fingerprint)).size, recommendations.length);
});

test("keeps unified CRO recommendations bounded and privacy-safe", () => {
  const recommendations = buildCRORecommendations({
    overview: { visitors: 40, conversions: 0, conversionRate: 0 },
    forms: [{ form_id: "contact", path: "/contact", started: 20, completed: 5, errors: 12, completionRate: 25 }],
    funnels: [],
    behaviour: { issues: [{ type: "Dead click", title: "Unlinked click targets need review", page: "/pricing", detail: "12 clicks had no link or explicit role metadata.", impact: "+2–5%", priority: "Medium" }], scrollPages: [] },
    pages: [{ path: "/pricing", visitors: 20, page_views: 40, conversions: 0 }],
  });
  const serialized = JSON.stringify(recommendations);
  assert.doesNotMatch(serialized, /visitorId|sessionId|password|email/i);
  for (const recommendation of recommendations) {
    assert.ok(recommendation.fingerprint.startsWith("cro:"));
    assert.ok(recommendation.evidence.length <= 8);
    assert.ok(recommendation.title && recommendation.problem && recommendation.reason && recommendation.recommendation);
    assert.ok(["High", "Medium", "Low"].includes(recommendation.priority));
  }
});

test("keeps live tracking queries bounded and privacy-safe", () => {
  const query = liveAnalyticsQuerySchema.parse({ organizationId: "00000000-0000-0000-0000-000000000001", websiteId: "00000000-0000-0000-0000-000000000002" });
  assert.equal(query.limit, 25);
  assert.equal(query.windowSeconds, 300);
  assert.throws(() => liveAnalyticsQuerySchema.parse({ ...query, limit: 51 }));
  assert.throws(() => liveAnalyticsQuerySchema.parse({ ...query, windowSeconds: 20 }));
  const event = toLiveEvent({ event_id: "evt_1", event_type: "page_view", occurred_at: "2026-08-03T00:00:00.000Z", path: "/pricing" });
  assert.deepEqual(event, { eventId: "evt_1", eventType: "page_view", occurredAt: "2026-08-03T00:00:00.000Z", path: "/pricing" });
  assert.equal("visitorId" in event, false);
});

test("defines privacy-safe live visitor contracts", () => {
  assert.equal(normalizeLivePath("https://example.com/pricing?email=hidden#plans"), "/pricing");
  assert.equal(normalizeLivePath("pricing?token=hidden"), "/pricing");
  assert.equal(toAnonymousVisitorLabel("visitor_123"), "Visitor #D556B1");
  assert.equal(toLiveActivityType("custom", "live_heartbeat"), "heartbeat");
  assert.equal(toLiveActivityType("unknown"), null);
  assert.equal(liveActivityTypeSchema.parse("conversion"), "conversion");
  assert.deepEqual(sanitizeLiveMetadata({ cta: " Start now ", formId: "signup", email: "secret@example.com", password: "hidden", ignored: "nope" }), { cta: "Start now", formId: "signup" });
  assert.deepEqual(liveVisitorActivitySchema.parse({ type: "click", occurredAt: "2026-08-06T00:00:00.000Z", path: "/pricing", label: "Start now" }), { type: "click", occurredAt: "2026-08-06T00:00:00.000Z", path: "/pricing", label: "Start now" });
  assert.equal(liveVisitorSummarySchema.parse({ anonymousLabel: "Visitor #ABC123", currentPath: "/pricing", lastActivity: "click", lastSeenAt: "2026-08-06T00:00:00.000Z", sessionCount: 1, eventCount: 2, device: "Desktop", browser: "Chrome", source: null }).anonymousLabel, "Visitor #ABC123");
  const visitor = toLiveVisitor({ visitor_id: "visitor-secret", last_seen: "2026-08-06T00:00:00.000Z", sessions: 1, events: 3, current_path: "https://example.com/pricing?email=secret@example.com", event_type: "click", event_name: null, user_agent: "Mozilla/5.0 Chrome/120.0", source_referrer: "https://google.com/search?q=secret" });
  assert.equal(visitor.currentPath, "/pricing");
  assert.match(visitor.anonymousLabel, /^Visitor #[A-F0-9]{6}$/);
  assert.equal("visitor_id" in visitor, false);
  assert.equal(visitor.lastActivity, "click");
  assert.throws(() => liveVisitorSummarySchema.parse({ anonymousLabel: "raw-visitor-id", currentPath: "/pricing", lastActivity: "click", lastSeenAt: "2026-08-06T00:00:00.000Z", sessionCount: 1, eventCount: 2, device: "Desktop", browser: "Chrome", source: null }));
  assert.throws(() => liveVisitorActivitySchema.parse({ type: "click", occurredAt: "2026-08-06T00:00:00.000Z", path: `/${"x".repeat(512)}`, label: "Click" }));
  const activity = toLiveVisitorActivity({ event_id: "evt-1", event_type: "custom", event_name: "form_error", occurred_at: new Date("2026-08-06T00:00:00.000Z"), path: "https://example.com/signup?email=hidden", properties: { formId: "signup", email: "hidden@example.com" } });
  assert.deepEqual(activity, { type: "form_error", occurredAt: "2026-08-06T00:00:00.000Z", path: "/signup", label: "Form error in signup" });
  assert.equal(liveActivityLabel("heartbeat", { email: "hidden@example.com" }), "Active on page");
});

test("encrypts API secrets without storing plaintext", () => {
  const previous = process.env.ENCRYPTION_KEY;
  process.env.ENCRYPTION_KEY = "a".repeat(64);
  const encrypted = encryptSecret("ag_live_test-secret");
  assert.notEqual(encrypted, "ag_live_test-secret");
  assert.equal(encrypted.split(":").length, 3);
  if (previous === undefined) delete process.env.ENCRYPTION_KEY; else process.env.ENCRYPTION_KEY = previous;
});

test("protects webhook secrets and rejects private webhook targets", () => {
  const previous = process.env.ENCRYPTION_KEY;
  process.env.ENCRYPTION_KEY = "a".repeat(64);
  const webhookUrl = "https://example.com/alerts";
  assert.equal(safeWebhookUrl(webhookUrl), webhookUrl);
  assert.equal(decryptSecret(encryptSecret(webhookUrl)), webhookUrl);
  assert.throws(() => safeWebhookUrl("http://localhost:4000/hook"), /INVALID_WEBHOOK_URL/);
  assert.throws(() => safeWebhookUrl("http://192.168.1.10/hook"), /INVALID_WEBHOOK_URL/);
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
  assert.match(trackerScript, /form_error/);
  assert.match(trackerScript, /form_field_focus/);
  assert.match(trackerScript, /formId/);
  assert.match(trackerScript, /scroll/);
  assert.match(trackerScript, /window\.aiGrowth/);
  assert.match(trackerScript, /keepalive/);
  assert.match(trackerScript, /live_heartbeat/);
  assert.match(trackerScript, /setInterval/);
  assert.match(trackerScript, /}, 30000\)/);
});

test("tracker script includes consent and privacy controls", () => {
  assert.match(trackerScript, /data-require-consent/);
  assert.match(trackerScript, /doNotTrack/);
  assert.match(trackerScript, /grantConsent/);
  assert.match(trackerScript, /denyConsent/);
  assert.match(trackerScript, /optOut/);
  assert.match(trackerScript, /optIn/);
  assert.match(trackerScript, /trackingAllowed/);
  assert.match(trackerScript, new RegExp(`sdkVersion: \\"${TRACKER_VERSION}\\"`));
  assert.doesNotMatch(trackerScript, /FormData/);
});

test("returns clear tracking verification states", () => {
  assert.equal(getTrackingVerificationStatus({ status: WebsiteStatus.ACTIVE, firstEventAt: null }).status, "TRACKING_NOT_DETECTED");
  assert.equal(getTrackingVerificationStatus({ status: WebsiteStatus.ACTIVE, firstEventAt: new Date() }).verified, true);
  assert.equal(getTrackingVerificationStatus({ status: WebsiteStatus.PAUSED, firstEventAt: new Date() }).status, "TRACKING_PAUSED");
  assert.equal(getTrackingVerificationStatus({ status: WebsiteStatus.ARCHIVED, firstEventAt: new Date() }).status, "TRACKING_ARCHIVED");
});

test("classifies tracking health from website activity", () => {
  const now = new Date("2026-08-07T12:00:00.000Z");
  assert.equal(getTrackingHealthStatus({ status: WebsiteStatus.ACTIVE, lastEventAt: new Date("2026-08-07T11:45:00.000Z") }, now), "HEALTHY");
  assert.equal(getTrackingHealthStatus({ status: WebsiteStatus.ACTIVE, lastEventAt: new Date("2026-08-07T10:00:00.000Z") }, now), "NEEDS_ATTENTION");
  assert.equal(getTrackingHealthStatus({ status: WebsiteStatus.ACTIVE, lastEventAt: null }, now), "NO_DATA");
  assert.equal(getTrackingHealthStatus({ status: WebsiteStatus.PAUSED, lastEventAt: new Date() }, now), "PAUSED");
  assert.equal(getTrackingHealthStatus({ status: WebsiteStatus.ARCHIVED, lastEventAt: new Date() }, now), "ARCHIVED");
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

test("uses safe free-MVP infrastructure defaults and bounded limits", () => {
  const previous = { free: process.env.FREE_MVP_MODE, storage: process.env.ANALYTICS_STORAGE, retention: process.env.EVENT_RETENTION_DAYS, max: process.env.MAX_TRACKING_EVENTS_PER_DAY };
  process.env.FREE_MVP_MODE = "true";
  process.env.ANALYTICS_STORAGE = "postgres";
  process.env.EVENT_RETENTION_DAYS = "999999";
  process.env.MAX_TRACKING_EVENTS_PER_DAY = "0";
  assert.equal(isFreeMvpMode(), true);
  assert.equal(getAnalyticsStorage(), "postgres");
  assert.equal(getEventRetentionDays(), 3650);
  assert.equal(getMaxTrackingEventsPerDay(), 100000);
  assert.equal(getInfrastructureConfig().freeMvpMode, true);
  for (const [key, value] of Object.entries({ FREE_MVP_MODE: previous.free, ANALYTICS_STORAGE: previous.storage, EVENT_RETENTION_DAYS: previous.retention, MAX_TRACKING_EVENTS_PER_DAY: previous.max })) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});

test("maps privacy-safe pipeline events to PostgreSQL tracking records", () => {
  const data = toTrackingEventData({ eventId: "evt_12345678", trackingId: "trk_12345678", websiteId: "website-1", eventType: "page_view", occurredAt: "2026-08-01T00:00:00.000Z", visitorId: "visitor-1", sessionId: "session-1", url: "https://example.com/home", referrer: null, properties: { cta: "Start" }, context: { language: "en-US" } });
  assert.equal(data.websiteId, "website-1");
  assert.equal(data.eventType, "page_view");
  assert.equal(data.occurredAt.toISOString(), "2026-08-01T00:00:00.000Z");
  assert.deepEqual(data.properties, { cta: "Start" });
});
