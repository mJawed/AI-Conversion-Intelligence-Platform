import { z } from "zod";
import { prisma } from "./lib/prisma";

export const analyticsQuerySchema = z.object({
  organizationId: z.string().uuid(),
  websiteId: z.string().uuid(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
  sort: z.string().trim().max(40).optional(),
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

function clickHouseBaseUrl() {
  if (process.env.CLICKHOUSE_ENABLED !== "true") throw new AnalyticsUnavailableError("ClickHouse analytics is not enabled");
  return process.env.CLICKHOUSE_URL ?? "http://localhost:8123";
}

async function queryClickHouse<T>(sql: string, parameters: Record<string, string | number>) {
  const url = new URL("/", clickHouseBaseUrl());
  url.searchParams.set("query", sql);
  Object.entries(parameters).forEach(([key, value]) => url.searchParams.set(`param_${key}`, String(value)));
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new AnalyticsUnavailableError(`ClickHouse returned ${response.status}`);
  const payload = await response.json() as { data?: T[] };
  return payload.data ?? [];
}

function eventWhere(context: AnalyticsContext) {
  return "website_id = {websiteId:String} AND occurred_at >= parseDateTimeBestEffort({from:String}) AND occurred_at < parseDateTimeBestEffort({to:String})";
}

function parameters(context: AnalyticsContext) {
  return { websiteId: context.websiteId, from: context.from, to: context.to, limit: context.limit, offset: context.offset };
}

export async function getOverview(context: AnalyticsContext) {
  const where = eventWhere(context);
  const params = parameters(context);
  const [metrics, topPages, traffic] = await Promise.all([
    queryClickHouse<{ visitors: number; sessions: number; conversions: number; page_views: number }>(`SELECT uniqExact(visitor_id) AS visitors, uniqExact(session_id) AS sessions, countIf(event_type = 'conversion') AS conversions, countIf(event_type = 'page_view') AS page_views FROM ai_growth_events WHERE ${where} FORMAT JSON`, params),
    queryClickHouse<{ path: string; visitors: number; share: number }>(`SELECT path, uniqExact(visitor_id) AS visitors, round(visitors / greatest((SELECT uniqExact(visitor_id) FROM ai_growth_events WHERE ${where}), 1) * 100, 1) AS share FROM (SELECT if(position(url, '/') > 0, substring(url, position(url, '/', 9)), '/') AS path, visitor_id FROM ai_growth_events WHERE ${where}) GROUP BY path ORDER BY visitors DESC LIMIT {limit:UInt32} OFFSET {offset:UInt32} FORMAT JSON`, params),
    queryClickHouse<{ day: string; visitors: number }>(`SELECT toDate(occurred_at) AS day, uniqExact(visitor_id) AS visitors FROM ai_growth_events WHERE ${where} GROUP BY day ORDER BY day ASC FORMAT JSON`, params),
  ]);
  const summary = metrics[0] ?? { visitors: 0, sessions: 0, conversions: 0, page_views: 0 };
  return { range: { from: context.from, to: context.to }, metrics: { ...summary, conversionRate: Number(summary.visitors) ? Number(((Number(summary.conversions) / Number(summary.visitors)) * 100).toFixed(2)) : 0 }, topPages, traffic };
}

export async function getVisitors(context: AnalyticsContext) {
  const rows = await queryClickHouse<{ visitor_id: string; last_seen: string; sessions: number; events: number; conversions: number; current_page: string }>(`SELECT visitor_id, max(occurred_at) AS last_seen, uniqExact(session_id) AS sessions, count() AS events, countIf(event_type = 'conversion') AS conversions, argMax(url, occurred_at) AS current_page FROM ai_growth_events WHERE ${eventWhere(context)} GROUP BY visitor_id ORDER BY last_seen DESC LIMIT {limit:UInt32} OFFSET {offset:UInt32} FORMAT JSON`, parameters(context));
  return { visitors: rows, pagination: { limit: context.limit, offset: context.offset, hasMore: rows.length === context.limit } };
}

export async function getSessions(context: AnalyticsContext) {
  const rows = await queryClickHouse<{ session_id: string; visitor_id: string; started_at: string; last_seen: string; events: number; pages: number; converted: number }>(`SELECT session_id, argMin(visitor_id, occurred_at) AS visitor_id, min(occurred_at) AS started_at, max(occurred_at) AS last_seen, count() AS events, uniqExact(url) AS pages, countIf(event_type = 'conversion') > 0 AS converted FROM ai_growth_events WHERE ${eventWhere(context)} GROUP BY session_id ORDER BY last_seen DESC LIMIT {limit:UInt32} OFFSET {offset:UInt32} FORMAT JSON`, parameters(context));
  return { sessions: rows, pagination: { limit: context.limit, offset: context.offset, hasMore: rows.length === context.limit } };
}

export async function getForms(context: AnalyticsContext) {
  const rows = await queryClickHouse<{ form_id: string; started: number; completed: number }>(`SELECT JSONExtractString(properties_json, 'formId') AS form_id, countIf(event_type = 'form_start') AS started, countIf(event_type = 'form_submit') AS completed FROM ai_growth_events WHERE ${eventWhere(context)} AND event_type IN ('form_start', 'form_submit') GROUP BY form_id HAVING form_id != '' ORDER BY started DESC LIMIT {limit:UInt32} OFFSET {offset:UInt32} FORMAT JSON`, parameters(context));
  return { forms: rows.map((row) => ({ ...row, completionRate: Number(row.started) ? Number(((Number(row.completed) / Number(row.started)) * 100).toFixed(2)) : 0 })), pagination: { limit: context.limit, offset: context.offset, hasMore: rows.length === context.limit } };
}

export async function getFunnels(_context: AnalyticsContext) {
  return { funnels: [], pagination: { limit: _context.limit, offset: _context.offset, hasMore: false }, message: "Funnel definitions will be added when funnel configuration is available." };
}

export async function getBehaviour(context: AnalyticsContext) {
  const rows = await queryClickHouse<{ event_type: string; events: number; visitors: number }>(`SELECT event_type, count() AS events, uniqExact(visitor_id) AS visitors FROM ai_growth_events WHERE ${eventWhere(context)} AND event_type IN ('click', 'scroll', 'page_view') GROUP BY event_type ORDER BY events DESC FORMAT JSON`, parameters(context));
  return { behaviour: rows, range: { from: context.from, to: context.to } };
}

export async function getHeatmaps(context: AnalyticsContext) {
  const rows = await queryClickHouse<{ url: string; clicks: number; visitors: number }>(`SELECT url, count() AS clicks, uniqExact(visitor_id) AS visitors FROM ai_growth_events WHERE ${eventWhere(context)} AND event_type = 'click' GROUP BY url ORDER BY clicks DESC LIMIT {limit:UInt32} OFFSET {offset:UInt32} FORMAT JSON`, parameters(context));
  return { heatmaps: rows, pagination: { limit: context.limit, offset: context.offset, hasMore: rows.length === context.limit }, message: "Coordinate-level heatmaps require click coordinates in the tracking payload." };
}

export async function getReplays(context: AnalyticsContext) {
  const rows = await queryClickHouse<{ session_id: string; visitor_id: string; started_at: string; last_seen: string; events: number; converted: number }>(`SELECT session_id, argMin(visitor_id, occurred_at) AS visitor_id, min(occurred_at) AS started_at, max(occurred_at) AS last_seen, count() AS events, countIf(event_type = 'conversion') > 0 AS converted FROM ai_growth_events WHERE ${eventWhere(context)} GROUP BY session_id ORDER BY last_seen DESC LIMIT {limit:UInt32} OFFSET {offset:UInt32} FORMAT JSON`, parameters(context));
  return { replays: rows, pagination: { limit: context.limit, offset: context.offset, hasMore: rows.length === context.limit } };
}

export async function getInsights(context: AnalyticsContext) {
  const behaviour = await getBehaviour(context);
  return { insights: [], evidence: behaviour.behaviour, message: "AI insight generation will be enabled after baseline analytics signals are available." };
}
