import { Prisma } from "@prisma/client";
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
    queryPostgres<{ event_id: string; event_type: string; occurred_at: Date; visitor_id: string; path: string }>(Prisma.sql`SELECT event_id, event_type, occurred_at, visitor_id, split_part(split_part(regexp_replace(url, '^https?://[^/]+', ''), '?', 1), '#', 1) AS path FROM tracking_events WHERE website_id = ${context.websiteId}::uuid AND occurred_at >= ${cutoff} ORDER BY occurred_at DESC LIMIT ${context.limit}`),
  ]);
  return {
    live: {
      activeVisitors: Number(activeRows[0]?.active_visitors ?? 0),
      recentEvents: events.map((event) => ({ eventId: event.event_id, eventType: event.event_type, occurredAt: iso(event.occurred_at), visitorId: event.visitor_id, path: event.path || "/" })),
      lastUpdatedAt: new Date().toISOString(),
      activityWindowSeconds: windowSeconds,
    },
  };
}

export async function getVisitors(context: AnalyticsContext) {
  const rows = await queryPostgres<{ visitor_id: string; last_seen: Date; sessions: number; events: number; conversions: number; current_page: string }>(Prisma.sql`WITH grouped AS (SELECT visitor_id, MAX(occurred_at) AS last_seen, COUNT(DISTINCT session_id)::int AS sessions, COUNT(*)::int AS events, COUNT(*) FILTER (WHERE event_type = 'conversion')::int AS conversions FROM tracking_events WHERE ${eventWhere(context)} GROUP BY visitor_id), latest AS (SELECT DISTINCT ON (visitor_id) visitor_id, url AS current_page FROM tracking_events WHERE ${eventWhere(context)} ORDER BY visitor_id, occurred_at DESC) SELECT grouped.visitor_id, grouped.last_seen, grouped.sessions, grouped.events, grouped.conversions, latest.current_page FROM grouped JOIN latest USING (visitor_id) ORDER BY grouped.last_seen DESC ${pagination(context)}`);
  return { visitors: rows.map((row) => ({ ...row, last_seen: iso(row.last_seen) })), pagination: { limit: context.limit, offset: context.offset, hasMore: rows.length === context.limit } };
}

export async function getSessions(context: AnalyticsContext) {
  const rows = await queryPostgres<{ session_id: string; visitor_id: string; started_at: Date; last_seen: Date; events: number; pages: number; converted: boolean }>(Prisma.sql`SELECT session_id, (ARRAY_AGG(visitor_id ORDER BY occurred_at ASC))[1] AS visitor_id, MIN(occurred_at) AS started_at, MAX(occurred_at) AS last_seen, COUNT(*)::int AS events, COUNT(DISTINCT url)::int AS pages, (COUNT(*) FILTER (WHERE event_type = 'conversion') > 0) AS converted FROM tracking_events WHERE ${eventWhere(context)} GROUP BY session_id ORDER BY last_seen DESC ${pagination(context)}`);
  return { sessions: rows.map((row) => ({ ...row, started_at: iso(row.started_at), last_seen: iso(row.last_seen) })), pagination: { limit: context.limit, offset: context.offset, hasMore: rows.length === context.limit } };
}

export async function getForms(context: AnalyticsContext) {
  const rows = await queryPostgres<{ form_id: string; started: number; completed: number }>(Prisma.sql`SELECT properties->>'formId' AS form_id, COUNT(*) FILTER (WHERE event_type = 'form_start')::int AS started, COUNT(*) FILTER (WHERE event_type = 'form_submit')::int AS completed FROM tracking_events WHERE ${eventWhere(context)} AND event_type IN ('form_start', 'form_submit') AND COALESCE(properties->>'formId', '') <> '' GROUP BY properties->>'formId' ORDER BY started DESC ${pagination(context)}`);
  return { forms: rows.map((row) => ({ ...row, completionRate: Number(row.started) ? Number(((Number(row.completed) / Number(row.started)) * 100).toFixed(2)) : 0 })), pagination: { limit: context.limit, offset: context.offset, hasMore: rows.length === context.limit } };
}

export async function getFunnels(context: AnalyticsContext) {
  const definitions = await prisma.funnel.findMany({ where: { organizationId: context.organizationId, websiteId: context.websiteId, status: "ACTIVE" }, orderBy: { updatedAt: "desc" }, take: context.limit, skip: context.offset, include: { steps: { orderBy: { position: "asc" } } } });
  const funnels = await Promise.all(definitions.map(async (definition) => {
    const stepRows = await Promise.all(definition.steps.map((step) => queryPostgres<{ visitors: number }>(Prisma.sql`SELECT COUNT(DISTINCT visitor_id)::int AS visitors FROM tracking_events WHERE ${eventWhere(context)} AND split_part(split_part(regexp_replace(url, '^https?://[^/]+', ''), '?', 1), '#', 1) = ${step.path}`)));
    const goalEventType = definition.goalType === "form_submit" ? "form_submit" : definition.goalType === "custom" ? "custom" : "conversion";
    const goalFilter = definition.goalType === "custom" ? Prisma.sql`AND properties->>'eventName' = ${definition.goalValue ?? ""}` : Prisma.empty;
    const conversionRows = await queryPostgres<{ conversions: number }>(Prisma.sql`SELECT COUNT(DISTINCT visitor_id)::int AS conversions FROM tracking_events WHERE ${eventWhere(context)} AND event_type = ${goalEventType} ${goalFilter}`);
    const visitors = stepRows.map((row) => Number(row[0]?.visitors ?? 0));
    const totalVisitors = visitors[0] ?? 0;
    const conversions = Number(conversionRows[0]?.conversions ?? 0);
    const steps = definition.steps.map((step, index) => { const count = visitors[index] ?? 0; const previous = visitors[index - 1] ?? count; const conversion = previous ? (count / previous) * 100 : 0; return { name: step.name, path: step.path, visitors: String(count), count: totalVisitors ? (count / totalVisitors) * 100 : 0, conversion: `${conversion.toFixed(1)}%`, dropOff: index === 0 ? "—" : `${Math.max(0, 100 - conversion).toFixed(1)}%` }; });
    const conversionRate = totalVisitors ? (conversions / totalVisitors) * 100 : 0;
    return { id: definition.id, name: definition.name, description: definition.description ?? "Custom conversion journey", goalType: definition.goalType, goalValue: definition.goalValue, totalVisitors: String(totalVisitors), conversions: String(conversions), conversionRate: `${conversionRate.toFixed(2)}%`, change: "—", steps, explanation: { title: conversions ? "Conversion signal detected" : "Not enough data yet", reason: conversions ? `${conversions} visitors matched this conversion goal in the selected period.` : "This funnel will show drop-off evidence after matching events are received.", confidence: totalVisitors ? "Measured" : "—", recommendation: conversions ? "Focus on the step with the largest drop-off before the conversion goal." : "Collect enough traffic to identify the largest conversion leak.", impact: "Not available" } };
  }));
  return { funnels, pagination: { limit: context.limit, offset: context.offset, hasMore: definitions.length === context.limit }, message: funnels.length ? undefined : "Create a funnel to measure a conversion journey." };
}

export async function getBehaviour(context: AnalyticsContext) {
  const rows = await queryPostgres<{ event_type: string; events: number; visitors: number }>(Prisma.sql`SELECT event_type, COUNT(*)::int AS events, COUNT(DISTINCT visitor_id)::int AS visitors FROM tracking_events WHERE ${eventWhere(context)} AND event_type IN ('click', 'scroll', 'page_view') GROUP BY event_type ORDER BY events DESC`);
  return { behaviour: rows, range: { from: context.from, to: context.to } };
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
  const [overview, forms, behaviour] = await Promise.all([getOverview(context), getForms(context), getBehaviour(context)]);
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
  for (const candidate of candidates) await prisma.insight.upsert({ where: { websiteId_fingerprint: { websiteId: context.websiteId, fingerprint: candidate.fingerprint } }, create: { ...candidate, organizationId: context.organizationId, websiteId: context.websiteId, evidence: candidate.evidence }, update: { ...candidate, evidence: candidate.evidence } });
  const insights = await prisma.insight.findMany({ where: { organizationId: context.organizationId, websiteId: context.websiteId }, orderBy: [{ status: "asc" }, { severity: "asc" }, { updatedAt: "desc" }] });
  return { insights: insights.map((insight) => ({ id: insight.id, category: insight.category, severity: insight.severity, status: insight.status === "OPEN" ? "Open" : insight.status === "RESOLVED" ? "Resolved" : "Dismissed", title: insight.title, page: insight.page, problem: insight.problem, reason: insight.reason, evidence: Array.isArray(insight.evidence) ? insight.evidence.map(String) : [], confidence: insight.confidence, businessImpact: insight.businessImpact, recommendation: insight.recommendation, expectedImprovement: insight.expectedImprovement, created: insight.createdAt.toISOString() })), evidence: behaviour.behaviour, message: candidates.length ? undefined : "More traffic is needed before reliable CRO insights can be generated." };
}
