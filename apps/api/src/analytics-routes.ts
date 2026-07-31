import { Router, type Request, type Response } from "express";
import { requireAuth } from "./auth-routes";
import { AnalyticsUnavailableError, analyticsQuerySchema, authorizeAnalyticsContext, getBehaviour, getForms, getFunnels, getHeatmaps, getInsights, getOverview, getReplays, getSessions, getVisitors, normalizeAnalyticsQuery } from "./analytics-service";

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

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
analyticsRouter.get("/visitors", (request, response) => run(request, response, getVisitors));
analyticsRouter.get("/sessions", (request, response) => run(request, response, getSessions));
analyticsRouter.get("/forms", (request, response) => run(request, response, getForms));
analyticsRouter.get("/funnels", (request, response) => run(request, response, getFunnels));
analyticsRouter.get("/behaviour", (request, response) => run(request, response, getBehaviour));
analyticsRouter.get("/behavior", (request, response) => run(request, response, getBehaviour));
analyticsRouter.get("/heatmaps", (request, response) => run(request, response, getHeatmaps));
analyticsRouter.get("/replays", (request, response) => run(request, response, getReplays));
analyticsRouter.get("/insights", (request, response) => run(request, response, getInsights));
