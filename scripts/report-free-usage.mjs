import { performance } from "node:perf_hooks";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();
dotenv.config({ path: "../../.env" });

const apiUrl = (process.env.API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
const retentionDays = Number(process.env.EVENT_RETENTION_DAYS || 30);
const maxEventsPerDay = Number(process.env.MAX_TRACKING_EVENTS_PER_DAY || 100000);
const prisma = new PrismaClient();

async function measureApi() {
  const startedAt = performance.now();
  const response = await fetch(`${apiUrl}/health/db`);
  const latencyMs = Math.round((performance.now() - startedAt) * 100) / 100;
  if (!response.ok) throw new Error(`API database health returned HTTP ${response.status}`);
  return { url: apiUrl, databaseHealth: "ok", latencyMs };
}

const [usage, size, websites, api] = await Promise.all([
  prisma.$queryRaw`SELECT COUNT(*)::int AS total_events, COUNT(*) FILTER (WHERE occurred_at >= NOW() - INTERVAL '30 days')::int AS events_last_30_days, MIN(occurred_at) AS oldest_event_at, MAX(occurred_at) AS newest_event_at FROM tracking_events`,
  prisma.$queryRaw`SELECT pg_database_size(current_database())::bigint AS database_bytes, pg_total_relation_size('tracking_events')::bigint AS tracking_events_bytes`,
  prisma.$queryRaw`SELECT COUNT(*)::int AS websites FROM websites`,
  measureApi(),
]);

await prisma.$disconnect();
const row = usage[0];
const sizes = size[0];
const report = {
  capturedAt: new Date().toISOString(),
  mode: { freeMvp: process.env.FREE_MVP_MODE !== "false", analyticsStorage: process.env.ANALYTICS_STORAGE || "postgres" },
  api,
  database: {
    websites: websites[0].websites,
    totalEvents: row.total_events,
    eventsLast30Days: row.events_last_30_days,
    oldestEventAt: row.oldest_event_at?.toISOString?.() ?? row.oldest_event_at,
    newestEventAt: row.newest_event_at?.toISOString?.() ?? row.newest_event_at,
    databaseBytes: Number(sizes.database_bytes),
    trackingEventsBytes: Number(sizes.tracking_events_bytes),
  },
  configuredLimits: { retentionDays, maxEventsPerDay },
  decision: "postgresql-only",
  scaleTriggers: [
    "Introduce distributed rate limiting only when multiple API instances require shared counters.",
    "Introduce a queue only when inline event ingestion misses the API latency or reliability target.",
    "Introduce ClickHouse only when measured PostgreSQL analytics latency or storage becomes the bottleneck.",
  ],
};
console.log(JSON.stringify(report, null, 2));
