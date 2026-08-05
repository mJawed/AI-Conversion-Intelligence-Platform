import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./lib/prisma";
import { buildCRORecommendations, evidenceText } from "./cro-recommendation-rules";

export const analyticsQuerySchema = z.object({
  organizationId: z.string().uuid(),
  websiteId: z.string().uuid(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
  sort: z.string().trim().max(40).optional(),
});
export const liveAnalyticsQuerySchema = analyticsQuerySchema.pick({ organizationId: true, websiteId: true }).extend({
  limit: z.coerce.number().int().min(1).max(50).default(25),
  windowSeconds: z.coerce.number().int().min(30).max(900).default(300),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
export type AnalyticsContext = { organizationId: string; websiteId: string; from: string; to: string; limit: number; offset: number; sort?: string };

export class AnalyticsUnavailableError extends Error {
  constructor(message = "Analytics service is unavailable") {
    super(message);
    this.name = "AnalyticsUnavailableError";
  }
}

const defaultRange = () => {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
};

export function normalizeAnalyticsQuery(query: AnalyticsQuery): AnalyticsContext {
  const defaults = defaultRange();
  const from = query.from ?? defaults.from;
  const to = query.to ?? defaults.to;
  if (new Date(from) >= new Date(to)) throw new Error("INVALID_DATE_RANGE");
  return { organizationId: query.organizationId, websiteId: query.websiteId, from, to, limit: query.limit, offset: query.offset, sort: query.sort };
}

export async function authorizeAnalyticsContext(context: AnalyticsContext, userId: string) {
  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: context.organizationId, userId } },
    select: { organization: { select: { status: true } } },
  });
  if (!membership) throw new Error("ANALYTICS_ACCESS_DENIED");
  if (membership.organization.status !== "ACTIVE") throw new Error("ORGANIZATION_INACTIVE");
  const website = await prisma.website.findFirst({ where: { id: context.websiteId, organizationId: context.organizationId }, select: { id: true, status: true } });
  if (!website) throw new Error("WEBSITE_NOT_FOUND");
  return website;
}

function eventWhere(context: AnalyticsContext) {
  return Prisma.sql`website_id = ${context.websiteId}::uuid AND occurred_at >= ${new Date(context.from)} AND occurred_at < ${new Date(context.to)}`;
}

function pagination(context: AnalyticsContext) {
  return Prisma.sql`LIMIT ${context.limit} OFFSET ${context.offset}`;
}

async function queryPostgres<T>(query: Prisma.Sql) {
  try {
    return await prisma.$queryRaw<T[]>(query);
  } catch (error) {
    console.error("PostgreSQL analytics query failed", error);
    throw new AnalyticsUnavailableError("PostgreSQL analytics is unavailable");
  }
}

function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function toLiveEvent(event: { event_id: string; event_type: string; occurred_at: Date | string; path: string | null }) {
  return { eventId: event.event_id, eventType: event.event_type, occurredAt: iso(event.occurred_at), path: event.path || "/" };
}

function visitorSignals(userAgent: unknown, referrer: string | null, scrollDepth: number | null) {
  const agent = typeof userAgent === "string" ? userAgent : "";
  const device = /ipad|tablet|android(?!.*mobile)/i.test(agent) ? "Tablet" : /mobile|iphone|ipod|android/i.test(agent) ? "Mobile" : agent ? "Desktop" : "Not available";
  const browser = /edg\//i.test(agent) ? "Edge" : /firefox\//i.test(agent) ? "Firefox" : /(?:chrome|crios)\//i.test(agent) ? "Chrome" : /safari\//i.test(agent) && !/(?:chrome|crios)\//i.test(agent) ? "Safari" : /opera|opr\//i.test(agent) ? "Opera" : agent ? "Other" : "Not available";
  let source = "Direct";
  if (referrer) {
    try { source = new URL(referrer).hostname.replace(/^www\./i, ""); } catch { source = "Referral"; }
  }
  return { device, browser, source, scrollDepth: scrollDepth ?? 0 };
}

function visitorTimeline(events: unknown) {
  if (!Array.isArray(events)) return [];
  return events.map((event) => {
    const row = event as { eventType?: unknown; occurredAt?: unknown; path?: unknown; properties?: unknown };
    const eventType = typeof row.eventType === "string" ? row.eventType : "custom";
    const path = typeof row.path === "string" && row.path ? row.path : "/";
    const properties = row.properties && typeof row.properties === "object" ? row.properties as Record<string, unknown> : {};
    const depth = typeof properties.depth === "number" || typeof properties.depth === "string" ? `${properties.depth}%` : "";
    const labels: Record<string, { title: string; icon: string }> = {
      session_start: { title: "Started session", icon: "⌂" },
      page_view: { title: "Viewed page", icon: "⌂" },
      click: { title: "Clicked an element", icon: "↗" },
      form_start: { title: "Started a form", icon: "▤" },
      form_submit: { title: "Submitted a form", icon: "✓" },
      conversion: { title: "Recorded conversion", icon: "✓" },
      scroll: { title: "Scrolled page", icon: "↕" },
      custom: { title: "Recorded activity", icon: "•" },
    };
    const label = labels[eventType] ?? labels.custom;
    return { time: iso(typeof row.occurredAt === "string" || row.occurredAt instanceof Date ? row.occurredAt : new Date()), title: label.title, detail: `${depth ? `${depth} on ` : ""}${path}`, icon: label.icon };
  });
}

export async function getOverview(context: AnalyticsContext) {
  const where = eventWhere(context);
  const [metrics, topPages, traffic] = await Promise.all([
    queryPostgres<{ visitors: number; sessions: number; conversions: number; page_views: number }>(Prisma.sql`SELECT COUNT(DISTINCT visitor_id)::int AS visitors, COUNT(DISTINCT session_id)::int AS sessions, COUNT(*) FILTER (WHERE event_type = 'conversion')::int AS conversions, COUNT(*) FILTER (WHERE event_type = 'page_view')::int AS page_views FROM tracking_events WHERE ${where}`),
    queryPostgres<{ path: string; visitors: number; share: number }>(Prisma.sql`WITH scoped AS (SELECT split_part(split_part(regexp_replace(url, '^https?://[^/]+', ''), '?', 1), '#', 1) AS path, visitor_id FROM tracking_events WHERE ${where}), total AS (SELECT COUNT(DISTINCT visitor_id)::numeric AS visitors FROM scoped) SELECT scoped.path, COUNT(DISTINCT scoped.visitor_id)::int AS visitors, ROUND(COUNT(DISTINCT scoped.visitor_id)::numeric / GREATEST(total.visitors, 1) * 100, 1)::float AS share FROM scoped CROSS JOIN total GROUP BY scoped.path, total.visitors ORDER BY visitors DESC ${pagination(context)}`),
    queryPostgres<{ day: string; visitors: number }>(Prisma.sql`SELECT TO_CHAR(DATE_TRUNC('day', occurred_at), 'YYYY-MM-DD') AS day, COUNT(DISTINCT visitor_id)::int AS visitors FROM tracking_events WHERE ${where} GROUP BY DATE_TRUNC('day', occurred_at) ORDER BY day ASC`),
  ]);
  const summary = metrics[0] ?? { visitors: 0, sessions: 0, conversions: 0, page_views: 0 };
  return { range: { from: context.from, to: context.to }, metrics: { ...summary, conversionRate: Number(summary.visitors) ? Number(((Number(summary.conversions) / Number(summary.visitors)) * 100).toFixed(2)) : 0 }, topPages, traffic };
}

export async function getLiveTracking(context: AnalyticsContext, windowSeconds: number) {
  const cutoff = new Date(Date.now() - windowSeconds * 1000);
  const [activeRows, events] = await Promise.all([
    queryPostgres<{ active_visitors: number }>(Prisma.sql`SELECT COUNT(DISTINCT visitor_id)::int AS active_visitors FROM tracking_events WHERE website_id = ${context.websiteId}::uuid AND occurred_at >= ${cutoff}`),
    queryPostgres<{ event_id: string; event_type: string; occurred_at: Date; path: string }>(Prisma.sql`SELECT event_id, event_type, occurred_at, split_part(split_part(regexp_replace(url, '^https?://[^/]+', ''), '?', 1), '#', 1) AS path FROM tracking_events WHERE website_id = ${context.websiteId}::uuid AND occurred_at >= ${cutoff} ORDER BY occurred_at DESC LIMIT ${context.limit}`),
  ]);
  return {
    live: {
      activeVisitors: Number(activeRows[0]?.active_visitors ?? 0),
      recentEvents: events.map(toLiveEvent),
      lastUpdatedAt: new Date().toISOString(),
      activityWindowSeconds: windowSeconds,
    },
  };
}

export async function getVisitors(context: AnalyticsContext) {
  const rows = await queryPostgres<{ visitor_id: string; last_seen: Date; sessions: number; events: number; conversions: number; current_page: string; user_agent: string | null; source_referrer: string | null; scroll_depth: number | null; timeline_events: unknown }>(Prisma.sql`WITH scoped AS (SELECT * FROM tracking_events WHERE ${eventWhere(context)}), grouped AS (SELECT visitor_id, MAX(occurred_at) AS last_seen, COUNT(DISTINCT session_id)::int AS sessions, COUNT(*)::int AS events, COUNT(*) FILTER (WHERE event_type = 'conversion')::int AS conversions FROM scoped GROUP BY visitor_id), latest AS (SELECT DISTINCT ON (visitor_id) visitor_id, url AS current_page, context->>'userAgent' AS user_agent FROM scoped ORDER BY visitor_id, occurred_at DESC), first_referrer AS (SELECT DISTINCT ON (visitor_id) visitor_id, referrer AS source_referrer FROM scoped WHERE referrer IS NOT NULL ORDER BY visitor_id, occurred_at ASC), scrolls AS (SELECT visitor_id, MAX(CASE WHEN properties->>'depth' ~ '^[0-9]+$' THEN (properties->>'depth')::int END)::int AS scroll_depth FROM scoped WHERE event_type = 'scroll' GROUP BY visitor_id), timeline_ranked AS (SELECT visitor_id, event_type, occurred_at, split_part(split_part(regexp_replace(url, '^https?://[^/]+', ''), '?', 1), '#', 1) AS path, properties, ROW_NUMBER() OVER (PARTITION BY visitor_id ORDER BY occurred_at DESC) AS timeline_rank FROM scoped), timelines AS (SELECT visitor_id, json_agg(json_build_object('eventType', event_type, 'occurredAt', occurred_at, 'path', path, 'properties', properties) ORDER BY occurred_at ASC) AS timeline_events FROM timeline_ranked WHERE timeline_rank <= 20 GROUP BY visitor_id) SELECT grouped.visitor_id, grouped.last_seen, grouped.sessions, grouped.events, grouped.conversions, latest.current_page, latest.user_agent, first_referrer.source_referrer, scrolls.scroll_depth, timelines.timeline_events FROM grouped JOIN latest USING (visitor_id) LEFT JOIN first_referrer USING (visitor_id) LEFT JOIN scrolls USING (visitor_id) LEFT JOIN timelines USING (visitor_id) ORDER BY grouped.last_seen DESC ${pagination(context)}`);
  return { visitors: rows.map((row) => ({ visitor_id: row.visitor_id, last_seen: iso(row.last_seen), sessions: row.sessions, events: row.events, conversions: row.conversions, current_page: row.current_page, ...visitorSignals(row.user_agent, row.source_referrer, row.scroll_depth), timeline: visitorTimeline(row.timeline_events) })), pagination: { limit: context.limit, offset: context.offset, hasMore: rows.length === context.limit } };
}

export async function getSessions(context: AnalyticsContext) {
  const rows = await queryPostgres<{ session_id: string; visitor_id: string; started_at: Date; last_seen: Date; events: number; pages: number; converted: boolean }>(Prisma.sql`SELECT session_id, (ARRAY_AGG(visitor_id ORDER BY occurred_at ASC))[1] AS visitor_id, MIN(occurred_at) AS started_at, MAX(occurred_at) AS last_seen, COUNT(*)::int AS events, COUNT(DISTINCT url)::int AS pages, (COUNT(*) FILTER (WHERE event_type = 'conversion') > 0) AS converted FROM tracking_events WHERE ${eventWhere(context)} GROUP BY session_id ORDER BY last_seen DESC ${pagination(context)}`);
  return { sessions: rows.map((row) => ({ ...row, started_at: iso(row.started_at), last_seen: iso(row.last_seen) })), pagination: { limit: context.limit, offset: context.offset, hasMore: rows.length === context.limit } };
}

export async function getForms(context: AnalyticsContext) {
  const rows = await queryPostgres<{ form_id: string; path: string; started: number; completed: number; errors: number; visitors: number }>(Prisma.sql`SELECT properties->>'formId' AS form_id, MIN(split_part(split_part(regexp_replace(url, '^https?://[^/]+', ''), '?', 1), '#', 1)) AS path, COUNT(*) FILTER (WHERE event_type = 'form_start')::int AS started, COUNT(*) FILTER (WHERE event_type = 'form_submit')::int AS completed, COUNT(*) FILTER (WHERE event_type = 'custom' AND properties->>'eventName' = 'form_error')::int AS errors, COUNT(DISTINCT visitor_id) FILTER (WHERE event_type = 'form_start')::int AS visitors FROM tracking_events WHERE ${eventWhere(context)} AND event_type IN ('form_start', 'form_submit', 'custom') AND COALESCE(properties->>'formId', '') <> '' GROUP BY properties->>'formId' ORDER BY started DESC ${pagination(context)}`);
  return { forms: rows.map((row) => ({ ...row, completionRate: Number(row.started) ? Number(((Number(row.completed) / Number(row.started)) * 100).toFixed(2)) : 0, abandonmentRate: Number(row.started) ? Number((((Number(row.started) - Number(row.completed)) / Number(row.started)) * 100).toFixed(2)) : 0 })), pagination: { limit: context.limit, offset: context.offset, hasMore: rows.length === context.limit } };
}

export async function getFunnels(context: AnalyticsContext) {
  const definitions = await prisma.funnel.findMany({ where: { organizationId: context.organizationId, websiteId: context.websiteId, status: "ACTIVE" }, orderBy: { updatedAt: "desc" }, take: context.limit, skip: context.offset, include: { steps: { orderBy: { position: "asc" } } } });
  const funnels = await Promise.all(definitions.map(async (definition) => {
    const stepRows = await Promise.all(definition.steps.map((step, index) => {
      const priorSteps = definition.steps.slice(0, index).map((prior) => Prisma.sql`EXISTS (SELECT 1 FROM tracking_events prior_event WHERE prior_event.website_id = ${context.websiteId}::uuid AND prior_event.visitor_id = current_event.visitor_id AND prior_event.occurred_at >= ${new Date(context.from)} AND prior_event.occurred_at < ${new Date(context.to)} AND prior_event.occurred_at <= current_event.occurred_at AND split_part(split_part(regexp_replace(prior_event.url, '^https?://[^/]+', ''), '?', 1), '#', 1) = ${prior.path})`);
      const orderedRequirement = priorSteps.length ? Prisma.sql`AND ${Prisma.join(priorSteps, " AND ")}` : Prisma.empty;
      return queryPostgres<{ visitors: number }>(Prisma.sql`SELECT COUNT(DISTINCT current_event.visitor_id)::int AS visitors FROM tracking_events current_event WHERE current_event.website_id = ${context.websiteId}::uuid AND current_event.occurred_at >= ${new Date(context.from)} AND current_event.occurred_at < ${new Date(context.to)} AND split_part(split_part(regexp_replace(current_event.url, '^https?://[^/]+', ''), '?', 1), '#', 1) = ${step.path} ${orderedRequirement}`);
    }));
    const goalEventType = definition.goalType === "form_submit" ? "form_submit" : definition.goalType === "custom" ? "custom" : "conversion";
    const goalFilter = definition.goalType === "custom" ? Prisma.sql`AND properties->>'eventName' = ${definition.goalValue ?? ""}` : Prisma.empty;
    const conversionRows = await queryPostgres<{ conversions: number }>(Prisma.sql`SELECT COUNT(DISTINCT current_event.visitor_id)::int AS conversions FROM tracking_events current_event WHERE current_event.website_id = ${context.websiteId}::uuid AND current_event.occurred_at >= ${new Date(context.from)} AND current_event.occurred_at < ${new Date(context.to)} AND current_event.event_type = ${goalEventType} ${goalFilter} ${definition.steps[0] ? Prisma.sql`AND EXISTS (SELECT 1 FROM tracking_events first_step WHERE first_step.website_id = ${context.websiteId}::uuid AND first_step.visitor_id = current_event.visitor_id AND first_step.occurred_at >= ${new Date(context.from)} AND first_step.occurred_at < ${new Date(context.to)} AND first_step.occurred_at <= current_event.occurred_at AND split_part(split_part(regexp_replace(first_step.url, '^https?://[^/]+', ''), '?', 1), '#', 1) = ${definition.steps[0].path})` : Prisma.empty}`);
    const visitors = stepRows.map((row) => Number(row[0]?.visitors ?? 0));
    const totalVisitors = visitors[0] ?? 0;
    const conversions = Number(conversionRows[0]?.conversions ?? 0);
    const dropOffs = visitors.map((count, index) => index === 0 ? 0 : Math.max(0, 100 - ((visitors[index - 1] ? count / visitors[index - 1] : 0) * 100)));
    const bottleneckIndex = dropOffs.reduce((best, value, index) => value > dropOffs[best] ? index : best, 0);
    const steps = definition.steps.map((step, index) => { const count = visitors[index] ?? 0; const previous = visitors[index - 1] ?? count; const conversion = previous ? (count / previous) * 100 : 0; const dropOff = dropOffs[index]; return { name: step.name, path: step.path, visitors: String(count), count: totalVisitors ? (count / totalVisitors) * 100 : 0, conversion: `${conversion.toFixed(1)}%`, dropOff: index === 0 ? "—" : `${dropOff.toFixed(1)}%`, issue: index > 0 && dropOff > 0 && index === bottleneckIndex ? "Largest measured drop-off" : undefined }; });
    const conversionRate = totalVisitors ? (conversions / totalVisitors) * 100 : 0;
    const bottleneck = definition.steps[bottleneckIndex];
    const bottleneckDropOff = dropOffs[bottleneckIndex] ?? 0;
    const hasEvidence = totalVisitors > 0;
    return { id: definition.id, name: definition.name, description: definition.description ?? "Custom conversion journey", goalType: definition.goalType, goalValue: definition.goalValue, totalVisitors: String(totalVisitors), conversions: String(conversions), conversionRate: `${conversionRate.toFixed(2)}%`, change: "—", steps, explanation: { title: hasEvidence && bottleneck && bottleneckDropOff > 0 ? `Largest drop-off: ${bottleneck.name}` : conversions ? "Conversion signal detected" : "Not enough data yet", reason: hasEvidence && bottleneck && bottleneckDropOff > 0 ? `${bottleneckDropOff.toFixed(1)}% of visitors are lost before reaching ${bottleneck.name}.` : conversions ? `${conversions} visitors matched this conversion goal in the selected period.` : "This funnel will show drop-off evidence after matching events are received.", confidence: totalVisitors >= 20 ? "High" : hasEvidence ? "Directional" : "—", recommendation: hasEvidence && bottleneck && bottleneckDropOff > 0 ? `Review the ${bottleneck.name} step for unclear copy, friction, or broken tracking before changing lower-funnel steps.` : conversions ? "Focus on the step with the largest drop-off before the conversion goal." : "Collect enough traffic to identify the largest conversion leak.", impact: hasEvidence && bottleneckDropOff > 0 ? `Recovering part of this loss could improve funnel completion by ${Math.max(3, Math.round(bottleneckDropOff * 0.15))}–${Math.max(6, Math.round(bottleneckDropOff * 0.3))}% relative.` : "Not available" } };
  }));
  return { funnels, pagination: { limit: context.limit, offset: context.offset, hasMore: definitions.length === context.limit }, message: funnels.length ? undefined : "Create a funnel to measure a conversion journey." };
}

export async function getBehaviour(context: AnalyticsContext) {
  const where = eventWhere(context);
  const [rows, clickTargets, scrollPages, rageClicks, deadClicks, journey] = await Promise.all([
    queryPostgres<{ event_type: string; events: number; visitors: number }>(Prisma.sql`SELECT event_type, COUNT(*)::int AS events, COUNT(DISTINCT visitor_id)::int AS visitors FROM tracking_events WHERE ${where} AND event_type IN ('click', 'scroll', 'page_view') GROUP BY event_type ORDER BY events DESC`),
    queryPostgres<{ page: string; selector: string; clicks: number; visitors: number }>(Prisma.sql`SELECT split_part(split_part(regexp_replace(url, '^https?://[^/]+', ''), '?', 1), '#', 1) AS page, COALESCE(NULLIF(properties->>'id', ''), NULLIF(properties->>'href', ''), NULLIF(properties->>'role', ''), properties->>'tag', 'unknown') AS selector, COUNT(*)::int AS clicks, COUNT(DISTINCT visitor_id)::int AS visitors FROM tracking_events WHERE ${where} AND event_type = 'click' GROUP BY page, selector ORDER BY clicks DESC LIMIT 50`),
    queryPostgres<{ page: string; visitors: number; depth: number }>(Prisma.sql`SELECT split_part(split_part(regexp_replace(url, '^https?://[^/]+', ''), '?', 1), '#', 1) AS page, COUNT(DISTINCT visitor_id)::int AS visitors, ROUND(AVG(CASE WHEN properties->>'depth' ~ '^[0-9]+$' THEN (properties->>'depth')::numeric END), 1)::float AS depth FROM tracking_events WHERE ${where} AND event_type = 'scroll' GROUP BY page ORDER BY visitors DESC LIMIT 50`),
    queryPostgres<{ page: string; events: number; visitors: number }>(Prisma.sql`WITH clicks AS (SELECT visitor_id, session_id, split_part(split_part(regexp_replace(url, '^https?://[^/]+', ''), '?', 1), '#', 1) AS page, FLOOR(EXTRACT(EPOCH FROM occurred_at) / 10) AS bucket FROM tracking_events WHERE ${where} AND event_type = 'click') SELECT page, COUNT(*)::int AS events, COUNT(DISTINCT visitor_id)::int AS visitors FROM clicks GROUP BY page, bucket HAVING COUNT(*) >= 3 ORDER BY events DESC LIMIT 20`),
    queryPostgres<{ page: string; events: number; visitors: number }>(Prisma.sql`SELECT split_part(split_part(regexp_replace(url, '^https?://[^/]+', ''), '?', 1), '#', 1) AS page, COUNT(*)::int AS events, COUNT(DISTINCT visitor_id)::int AS visitors FROM tracking_events WHERE ${where} AND event_type = 'click' AND COALESCE(properties->>'href', '') = '' AND COALESCE(properties->>'role', '') = '' GROUP BY page ORDER BY events DESC LIMIT 20`),
    queryPostgres<{ landing: string; exit: string; sessions: number }>(Prisma.sql`WITH session_pages AS (SELECT session_id, ARRAY_AGG(split_part(split_part(regexp_replace(url, '^https?://[^/]+', ''), '?', 1), '#', 1) ORDER BY occurred_at ASC) AS pages FROM tracking_events WHERE ${where} GROUP BY session_id) SELECT pages[1] AS landing, pages[array_length(pages, 1)] AS exit, COUNT(*)::int AS sessions FROM session_pages GROUP BY landing, exit ORDER BY sessions DESC LIMIT 20`),
  ]);
  const mappedScrollPages = scrollPages.map((page) => ({ page: page.page || "/", visitors: String(page.visitors), depth: Number(page.depth ?? 0), fold: Math.min(100, Math.round(Number(page.depth ?? 0) + 20)) }));
  const issues = [
    ...rageClicks.map((row) => ({ type: "Rage click", title: "Visitors repeatedly click on the same page", page: row.page || "/", detail: `${row.events} clicks across ${row.visitors} visitors were clustered within short intervals.`, impact: "+3–7%", priority: "High" })),
    ...deadClicks.map((row) => ({ type: "Dead click", title: "Unlinked click targets need review", page: row.page || "/", detail: `${row.events} clicks had no link or explicit role metadata.`, impact: "+2–5%", priority: "Medium" })),
    ...mappedScrollPages.filter((row) => row.depth > 0 && row.depth < 50).slice(0, 5).map((row) => ({ type: "Scroll drop-off", title: "Visitors stop before reaching deeper content", page: row.page, detail: `Average tracked scroll depth is ${row.depth}% across ${row.visitors} visitors.`, impact: "+3–6%", priority: "Medium" })),
  ];
  const clickSummary = rows.find((row) => row.event_type === "click");
  const scrollSummary = rows.find((row) => row.event_type === "scroll");
  return { behaviour: rows, clickTargets, scrollPages: mappedScrollPages, issues, journey, summary: { totalClicks: Number(clickSummary?.events ?? 0), avgScrollDepth: mappedScrollPages.length ? Number((mappedScrollPages.reduce((sum, page) => sum + page.depth, 0) / mappedScrollPages.length).toFixed(1)) : null, rageClicks: rageClicks.reduce((sum, row) => sum + Number(row.events), 0), deadClicks: deadClicks.reduce((sum, row) => sum + Number(row.events), 0), scrollEvents: Number(scrollSummary?.events ?? 0) }, range: { from: context.from, to: context.to } };
}

async function getPageConversionSignals(context: AnalyticsContext) {
  return queryPostgres<{ path: string; visitors: number; page_views: number; conversions: number }>(Prisma.sql`SELECT split_part(split_part(regexp_replace(url, '^https?://[^/]+', ''), '?', 1), '#', 1) AS path, COUNT(DISTINCT visitor_id)::int AS visitors, COUNT(*) FILTER (WHERE event_type = 'page_view')::int AS page_views, COUNT(*) FILTER (WHERE event_type = 'conversion')::int AS conversions FROM tracking_events WHERE ${eventWhere(context)} GROUP BY path ORDER BY visitors DESC LIMIT 20`);
}

export async function getHeatmaps(context: AnalyticsContext) {
  const rows = await queryPostgres<{ url: string; clicks: number; visitors: number }>(Prisma.sql`SELECT url, COUNT(*)::int AS clicks, COUNT(DISTINCT visitor_id)::int AS visitors FROM tracking_events WHERE ${eventWhere(context)} AND event_type = 'click' GROUP BY url ORDER BY clicks DESC ${pagination(context)}`);
  return { heatmaps: rows, pagination: { limit: context.limit, offset: context.offset, hasMore: rows.length === context.limit }, message: "Coordinate-level heatmaps require click coordinates in the tracking payload." };
}

export async function getReplays(context: AnalyticsContext) {
  const rows = await queryPostgres<{ session_id: string; visitor_id: string; started_at: Date; last_seen: Date; events: number; converted: boolean }>(Prisma.sql`SELECT session_id, (ARRAY_AGG(visitor_id ORDER BY occurred_at ASC))[1] AS visitor_id, MIN(occurred_at) AS started_at, MAX(occurred_at) AS last_seen, COUNT(*)::int AS events, (COUNT(*) FILTER (WHERE event_type = 'conversion') > 0) AS converted FROM tracking_events WHERE ${eventWhere(context)} GROUP BY session_id ORDER BY last_seen DESC ${pagination(context)}`);
  return { replays: rows.map((row) => ({ ...row, started_at: iso(row.started_at), last_seen: iso(row.last_seen) })), pagination: { limit: context.limit, offset: context.offset, hasMore: rows.length === context.limit } };
}

export async function getInsights(context: AnalyticsContext) {
  const results = await Promise.allSettled([getOverview(context), getForms(context), getFunnels(context), getBehaviour(context), getPageConversionSignals(context)]);
  const overview = results[0].status === "fulfilled" ? results[0].value : { metrics: { visitors: 0, sessions: 0, conversions: 0, page_views: 0, conversionRate: 0 }, topPages: [], traffic: [], range: { from: context.from, to: context.to } };
  const forms = results[1].status === "fulfilled" ? results[1].value : { forms: [], pagination: { limit: context.limit, offset: context.offset, hasMore: false } };
  const funnels = results[2].status === "fulfilled" ? results[2].value : { funnels: [], pagination: { limit: context.limit, offset: context.offset, hasMore: false }, message: "Funnel analytics unavailable" };
  const behaviour = results[3].status === "fulfilled" ? results[3].value : { behaviour: [], issues: [], scrollPages: [], clickTargets: [], journey: [], summary: { totalClicks: 0, avgScrollDepth: null, rageClicks: 0, deadClicks: 0, scrollEvents: 0 }, range: { from: context.from, to: context.to } };
  const pageSignals = results[4].status === "fulfilled" ? results[4].value : [];
  const sourceNames = ["overview", "forms", "funnels", "behaviour", "pages"];
  const unavailableSources = results.flatMap((result, index) => result.status === "rejected" ? [sourceNames[index]] : []);
  const candidates: Array<{ fingerprint: string; category: string; severity: string; title: string; page: string; problem: string; reason: string; evidence: string[]; confidence: string; businessImpact: string; recommendation: string; expectedImprovement: string }> = [];
  const visitors = Number(overview.metrics.visitors);
  const conversionRate = Number(overview.metrics.conversionRate);
  if (visitors >= 20 && conversionRate < 2) candidates.push({ fingerprint: "low-conversion-rate", category: "CTA", severity: "High", title: "The conversion signal is below a healthy baseline", page: "/", problem: `Only ${conversionRate.toFixed(2)}% of visitors triggered a conversion.`, reason: "Traffic is arriving, but the primary journey is not producing enough conversion events.", evidence: [`${visitors} unique visitors`, `${overview.metrics.conversions} conversions`, `${conversionRate.toFixed(2)}% conversion rate`], confidence: "High", businessImpact: "A small improvement in the primary journey can materially increase qualified outcomes.", recommendation: "Review the primary CTA, value proposition, and conversion-event instrumentation on the highest-traffic page.", expectedImprovement: "+5–10% relative" });
  for (const form of forms.forms) {
    const started = Number(form.started); const completionRate = Number(form.completionRate);
    if (started >= 10 && completionRate < 50) candidates.push({ fingerprint: `form-completion-${form.form_id}`, category: "Forms", severity: "High", title: `Form ${form.form_id} loses more than half of starters`, page: "Forms", problem: `${completionRate.toFixed(1)}% of form starters completed the form.`, reason: "A large gap between form starts and submissions indicates friction, uncertainty, or an implementation issue.", evidence: [`${started} form starts`, `${form.completed} submissions`, `${completionRate.toFixed(1)}% completion rate`], confidence: "High", businessImpact: "Recovering abandoned form starts can increase leads without additional traffic.", recommendation: "Review required fields, validation errors, mobile layout, and the clarity of the submit CTA.", expectedImprovement: "+8–15% relative" });
  }
  const clickRow = behaviour.behaviour.find((row) => row.event_type === "click");
  if (clickRow && Number(clickRow.visitors) >= 20 && Number(clickRow.events) / Number(clickRow.visitors) > 8) candidates.push({ fingerprint: "high-click-density", category: "UX", severity: "Medium", title: "Visitors generate unusually dense click activity", page: "Site-wide", problem: `${clickRow.events} clicks were recorded across ${clickRow.visitors} visitors.`, reason: "Repeated interaction can indicate unclear affordances, dead clicks, or visitors searching for the next step.", evidence: [`${clickRow.events} click events`, `${clickRow.visitors} visitors`, `${(Number(clickRow.events) / Number(clickRow.visitors)).toFixed(1)} clicks per visitor`], confidence: "Medium", businessImpact: "Reducing interaction confusion can improve journey progression and reduce wasted sessions.", recommendation: "Inspect high-click pages for unclear controls, dead zones, and competing calls to action.", expectedImprovement: "+3–7% relative" });
  const unifiedRecommendations = buildCRORecommendations({ overview: { visitors, conversions: Number(overview.metrics.conversions), conversionRate }, forms: forms.forms, funnels: funnels.funnels, behaviour: { issues: behaviour.issues, scrollPages: behaviour.scrollPages }, pages: pageSignals });
  for (const recommendation of unifiedRecommendations) {
    candidates.push({ fingerprint: recommendation.fingerprint, category: recommendation.category, severity: recommendation.priority, title: recommendation.title, page: recommendation.page, problem: recommendation.problem, reason: recommendation.reason, evidence: evidenceText(recommendation), confidence: recommendation.confidence, businessImpact: recommendation.businessImpact, recommendation: recommendation.recommendation, expectedImprovement: recommendation.expectedImprovement });
  }
  const uniqueCandidates = [...new Map(candidates.map((candidate) => [candidate.fingerprint, candidate])).values()];
  for (const candidate of uniqueCandidates) await prisma.insight.upsert({ where: { websiteId_fingerprint: { websiteId: context.websiteId, fingerprint: candidate.fingerprint } }, create: { ...candidate, organizationId: context.organizationId, websiteId: context.websiteId, evidence: candidate.evidence }, update: { category: candidate.category, severity: candidate.severity, title: candidate.title, page: candidate.page, problem: candidate.problem, reason: candidate.reason, evidence: candidate.evidence, confidence: candidate.confidence, businessImpact: candidate.businessImpact, recommendation: candidate.recommendation, expectedImprovement: candidate.expectedImprovement } });
  const insights = await prisma.insight.findMany({ where: { organizationId: context.organizationId, websiteId: context.websiteId }, orderBy: [{ status: "asc" }, { severity: "asc" }, { updatedAt: "desc" }] });
  const mappedInsights = insights.map((insight) => ({ id: insight.id, source: insight.fingerprint.startsWith("cro:") ? insight.fingerprint.split(":")[1] : insight.category.toLowerCase(), category: insight.category, severity: insight.severity, status: insight.status === "OPEN" ? "Open" : insight.status === "RESOLVED" ? "Resolved" : "Dismissed", title: insight.title, page: insight.page, problem: insight.problem, reason: insight.reason, evidence: Array.isArray(insight.evidence) ? insight.evidence.map(String) : [], confidence: insight.confidence, businessImpact: insight.businessImpact, recommendation: insight.recommendation, expectedImprovement: insight.expectedImprovement, created: insight.createdAt.toISOString(), updated: insight.updatedAt.toISOString() }));
  const alerts = mappedInsights.filter((insight) => insight.severity === "High" && insight.status === "Open").slice(0, 5).map((insight) => ({ id: insight.id, source: insight.source, category: insight.category, title: insight.title, page: insight.page, created: insight.created, updated: insight.updated }));
  return { insights: mappedInsights.map(({ updated: _updated, ...insight }) => insight), alerts, alertCount: alerts.length, evidence: behaviour.behaviour, unavailableSources, message: uniqueCandidates.length ? undefined : "More traffic is needed before reliable CRO insights can be generated." };
}
