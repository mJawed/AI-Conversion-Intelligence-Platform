import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { prisma } from "./lib/prisma";
import { authRouter } from "./auth-routes";
import { adminRouter } from "./admin-routes";
import { billingRouter } from "./billing-routes";
import { organizationRouter } from "./organization-routes";
import { websiteRouter } from "./website-routes";
import { funnelRouter } from "./funnel-routes";
import { insightRouter } from "./insight-routes";
import { collectorRouter } from "./collector-routes";
import { getPipelineMetrics, startEventConsumer, stopEventPipeline } from "./event-pipeline";
import { analyticsRouter } from "./analytics-routes";
import { apiKeyRouter } from "./api-key-routes";
import { privacyRouter, organizationPrivacyRouter } from "./privacy-routes";
import { writeSafeRequestLog } from "./security";
import { trackerScript } from "./tracker";

dotenv.config();
dotenv.config({ path: "../../.env" });

const app = express();
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
const allowedOrigins = new Set((process.env.CORS_ORIGINS ?? "http://localhost:3000").split(",").map((origin) => origin.trim()).filter(Boolean));

app.use(helmet());
app.use("/api/v1/collect", cors());
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin) ? origin : false), credentials: true }));
app.use((request, response, next) => { const startedAt = Date.now(); response.once("finish", () => writeSafeRequestLog(request, response, startedAt)); next(); });
app.use(express.json({ limit: "32kb" }));
app.use("/api/v1/collect", collectorRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/billing", billingRouter);
app.use("/api/v1/privacy", privacyRouter);
app.use("/api/v1/organizations", organizationRouter);
app.use("/api/v1/organizations/:organizationId", organizationPrivacyRouter);
app.use("/api/v1/organizations/:organizationId/api-keys", apiKeyRouter);
app.use("/api/v1/organizations/:organizationId/websites", websiteRouter);
app.use("/api/v1/organizations/:organizationId/websites/:websiteId/funnels", funnelRouter);
app.use("/api/v1/organizations/:organizationId/websites/:websiteId/insights", insightRouter);

app.get("/health", (_request, response) => {
  response.json({ service: "api", status: "ok", timestamp: new Date().toISOString() });
});

app.get("/tracker.js", (_request, response) => {
  response.type("application/javascript").set({ "Cache-Control": "public, max-age=300", "Cross-Origin-Resource-Policy": "cross-origin" }).send(trackerScript);
});

app.get("/health/db", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json({ service: "database", status: "ok", timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Database health check failed", error);
    response.status(503).json({ service: "database", status: "error", message: "Database unavailable" });
  }
});

app.get("/health/pipeline", (_request, response) => {
  response.json({ service: "event-pipeline", status: "ok", metrics: getPipelineMetrics(), timestamp: new Date().toISOString() });
});

app.get("/ready", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const pipeline = getPipelineMetrics();
    if (pipeline.enabled && pipeline.state !== "ready") { response.status(503).json({ status: "not_ready", database: "ok", pipeline }); return; }
    response.json({ status: "ready", database: "ok", pipeline });
  } catch (error) {
    console.error("Readiness check failed", error);
    response.status(503).json({ status: "not_ready", database: "error" });
  }
});

app.get("/api/v1", (_request, response) => {
  response.json({ name: "AI Growth API", version: "v1", status: "ready", infrastructure: getPipelineMetrics() });
});

const server = app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
  if (process.env.EVENT_PIPELINE_ENABLED === "true") {
    void startEventConsumer().catch((error) => console.error("Event pipeline startup failed", error));
  }
});

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down API`);
  await stopEventPipeline();
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
