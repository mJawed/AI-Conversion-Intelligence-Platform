import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { requireAuth } from "./auth-routes";
import { AnalyticsUnavailableError, analyticsQuerySchema, authorizeAnalyticsContext, getBehaviour, getForms, getFunnels, getHeatmaps, getInsights, getLiveTracking, getOverview, getReplays, getSessions, getVisitors, normalizeAnalyticsQuery } from "./analytics-service";

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

const liveQuerySchema = analyticsQuerySchema.pick({ organizationId: true, websiteId: true }).extend({
  limit: z.coerce.number().int().min(1).max(50).default(25),
  windowSeconds: z.coerce.number().int().min(30).max(900).default(300),
});
const liveRateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkLiveRateLimit(key: string) {
  const now = Date.now();
  const current = liveRateBuckets.get(key);
  if (!current || current.resetAt <= now) {
    liveRateBuckets.set(key, { count: 1, resetAt: now + 60_000 });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  current.count += 1;
  return { allowed: current.count <= 30, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
}

function getContext(request: Request, response: Response) {
  const parsed = analyticsQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({ error: "INVALID_ANALYTICS_QUERY", details: parsed.error.flatten() });
    return null;
  }
  try { return normalizeAnalyticsQuery(parsed.data); } catch { response.status(400).json({ error: "INVALID_DATE_RANGE" }); return null; }
}

async function run(request: Request, response: Response, query: (context: ReturnType<typeof normalizeAnalyticsQuery>) => Promise<unknown>) {
  const context = getContext(request, response);
  if (!context) return;
  try {
    await authorizeAnalyticsContext(context, request.authUserId!);
    response.json(await query(context));
  } catch (error) {
    if (error instanceof Error && error.message === "ANALYTICS_ACCESS_DENIED") { response.status(403).json({ error }); return; }
    if (error instanceof Error && error.message === "ORGANIZATION_INACTIVE") { response.status(403).json({ error: "ORGANIZATION_INACTIVE" }); return; }
    if (error instanceof Error && error.message === "WEBSITE_NOT_FOUND") { response.status(404).json({ error: "WEBSITE_NOT_FOUND" }); return; }
    if (error instanceof AnalyticsUnavailableError) { response.status(503).json({ error: "ANALYTICS_UNAVAILABLE", message: error.message }); return; }
    console.error("Analytics request failed", error);
    response.status(500).json({ error: "ANALYTICS_REQUEST_FAILED" });
  }
}

analyticsRouter.get("/overview", (request, response) => run(request, response, getOverview));
analyticsRouter.get("/live", async (request, response) => {
  const parsed = liveQuerySchema.safeParse(request.query);
  if (!parsed.success) { response.status(400).json({ error: "INVALID_LIVE_QUERY", details: parsed.error.flatten() }); return; }
  const rate = checkLiveRateLimit(`${request.authUserId}:${parsed.data.organizationId}:${parsed.data.websiteId}`);
  if (!rate.allowed) { response.setHeader("Retry-After", String(rate.retryAfterSeconds)); response.status(429).json({ error: "LIVE_RATE_LIMITED", retryAfterSeconds: rate.retryAfterSeconds }); return; }
  response.setHeader("Cache-Control", "no-store");
  try {
    const now = new Date();
    const context = normalizeAnalyticsQuery({ ...parsed.data, from: new Date(now.getTime() - parsed.data.windowSeconds * 1000).toISOString(), to: now.toISOString(), offset: 0 });
    await authorizeAnalyticsContext(context, request.authUserId!);
    response.json(await getLiveTracking(context, parsed.data.windowSeconds));
  } catch (error) {
    if (error instanceof Error && error.message === "ANALYTICS_ACCESS_DENIED") { response.status(403).json({ error: "ANALYTICS_ACCESS_DENIED" }); return; }
    if (error instanceof Error && error.message === "ORGANIZATION_INACTIVE") { response.status(403).json({ error: "ORGANIZATION_INACTIVE" }); return; }
    if (error instanceof Error && error.message === "WEBSITE_NOT_FOUND") { response.status(404).json({ error: "WEBSITE_NOT_FOUND" }); return; }
    if (error instanceof AnalyticsUnavailableError) { response.status(503).json({ error: "ANALYTICS_UNAVAILABLE", message: error.message }); return; }
    console.error("Live analytics request failed", error);
    response.status(500).json({ error: "LIVE_ANALYTICS_FAILED" });
  }
});
analyticsRouter.get("/visitors", (request, response) => run(request, response, getVisitors));
analyticsRouter.get("/sessions", (request, response) => run(request, response, getSessions));
analyticsRouter.get("/forms", (request, response) => run(request, response, getForms));
analyticsRouter.get("/funnels", (request, response) => run(request, response, getFunnels));
analyticsRouter.get("/behaviour", (request, response) => run(request, response, getBehaviour));
analyticsRouter.get("/behavior", (request, response) => run(request, response, getBehaviour));
analyticsRouter.get("/heatmaps", (request, response) => run(request, response, getHeatmaps));
analyticsRouter.get("/replays", (request, response) => run(request, response, getReplays));
analyticsRouter.get("/insights", (request, response) => run(request, response, getInsights));
