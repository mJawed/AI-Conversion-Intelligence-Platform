import { AlertDeliveryStatus, AlertEndpointStatus, InsightStatus } from "@prisma/client";
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { requireAuth } from "./auth-routes";
import { writeAuditLog } from "./audit";
import { requireOrganizationMember, requireOrganizationRole } from "./organization-routes";
import { decryptSecret, encryptSecret } from "./security";
import { prisma } from "./lib/prisma";

const endpointSchema = z.object({ name: z.string().trim().min(2).max(80), url: z.string().url().max(2048) });
const preferenceSchema = z.object({ websiteId: z.string().uuid(), enabled: z.boolean(), minimumPriority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("HIGH") });
const dispatchSchema = z.object({ websiteId: z.string().uuid() });

export function safeWebhookUrl(value: string) {
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) throw new Error("INVALID_WEBHOOK_URL");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host === "::1" || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) throw new Error("INVALID_WEBHOOK_URL");
  return url.toString();
}

function endpointView(endpoint: { id: string; name: string; status: AlertEndpointStatus; lastDeliveryAt: Date | null; lastDeliveryStatus: AlertDeliveryStatus | null; createdAt: Date }) {
  return { id: endpoint.id, name: endpoint.name, status: endpoint.status, lastDeliveryAt: endpoint.lastDeliveryAt?.toISOString() ?? null, lastDeliveryStatus: endpoint.lastDeliveryStatus, createdAt: endpoint.createdAt.toISOString() };
}

async function deliver(url: string, payload: Record<string, unknown>) {
  try {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "User-Agent": "AI-Growth-Alerts/1.0" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(5000) });
    return { ok: response.ok, status: response.status, error: response.ok ? null : `Webhook returned HTTP ${response.status}` };
  } catch (error) {
    return { ok: false, status: null, error: error instanceof Error ? error.message.slice(0, 240) : "Webhook delivery failed" };
  }
}

export const alertRouter = Router({ mergeParams: true });
alertRouter.use(requireAuth, requireOrganizationMember, requireOrganizationRole("OWNER", "ADMIN"));

alertRouter.get("/", async (request, response) => {
  const endpoints = await prisma.webhookEndpoint.findMany({ where: { organizationId: request.organizationId! }, orderBy: { createdAt: "desc" } });
  const websiteId = typeof request.query.websiteId === "string" ? request.query.websiteId : undefined;
  const preference = websiteId ? await prisma.alertPreference.findUnique({ where: { organizationId_websiteId: { organizationId: request.organizationId!, websiteId } } }) : null;
  response.json({ endpoints: endpoints.map(endpointView), preference: preference ? { websiteId: preference.websiteId, enabled: preference.enabled, minimumPriority: preference.minimumPriority } : null });
});

alertRouter.post("/webhooks", async (request, response) => {
  const parsed = endpointSchema.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }); return; }
  let url: string;
  try { url = safeWebhookUrl(parsed.data.url); } catch { response.status(400).json({ error: "INVALID_WEBHOOK_URL" }); return; }
  try {
    const endpoint = await prisma.webhookEndpoint.create({ data: { organizationId: request.organizationId!, name: parsed.data.name, encryptedUrl: encryptSecret(url) } });
    await writeAuditLog({ organizationId: request.organizationId, userId: request.authUserId, action: "alert.webhook_created", entityType: "webhook_endpoint", entityId: endpoint.id, metadata: { name: endpoint.name }, ipAddress: request.ip });
    response.status(201).json({ endpoint: endpointView(endpoint) });
  } catch (error) { console.error("Alert webhook creation failed", error); response.status(500).json({ error: "ALERT_WEBHOOK_CREATE_FAILED" }); }
});

alertRouter.delete("/webhooks/:endpointId", async (request, response) => {
  const endpoint = await prisma.webhookEndpoint.findFirst({ where: { id: request.params.endpointId, organizationId: request.organizationId! } });
  if (!endpoint) { response.status(404).json({ error: "ALERT_WEBHOOK_NOT_FOUND" }); return; }
  await prisma.webhookEndpoint.delete({ where: { id: endpoint.id } });
  await writeAuditLog({ organizationId: request.organizationId, userId: request.authUserId, action: "alert.webhook_deleted", entityType: "webhook_endpoint", entityId: endpoint.id, ipAddress: request.ip });
  response.status(204).send();
});

alertRouter.patch("/preferences", async (request, response) => {
  const parsed = preferenceSchema.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }); return; }
  const website = await prisma.website.findFirst({ where: { id: parsed.data.websiteId, organizationId: request.organizationId! }, select: { id: true } });
  if (!website) { response.status(404).json({ error: "WEBSITE_NOT_FOUND" }); return; }
  const preference = await prisma.alertPreference.upsert({ where: { organizationId_websiteId: { organizationId: request.organizationId!, websiteId: website.id } }, create: { organizationId: request.organizationId!, websiteId: website.id, enabled: parsed.data.enabled, minimumPriority: parsed.data.minimumPriority }, update: { enabled: parsed.data.enabled, minimumPriority: parsed.data.minimumPriority } });
  response.json({ preference: { websiteId: preference.websiteId, enabled: preference.enabled, minimumPriority: preference.minimumPriority } });
});

alertRouter.post("/webhooks/:endpointId/test", async (request, response) => {
  const endpoint = await prisma.webhookEndpoint.findFirst({ where: { id: request.params.endpointId, organizationId: request.organizationId!, status: "ACTIVE" } });
  if (!endpoint) { response.status(404).json({ error: "ALERT_WEBHOOK_NOT_FOUND" }); return; }
  const result = await deliver(decryptSecret(endpoint.encryptedUrl), { type: "ai_growth.alert_test", sentAt: new Date().toISOString(), endpoint: endpoint.name });
  await prisma.webhookEndpoint.update({ where: { id: endpoint.id }, data: { lastDeliveryAt: new Date(), lastDeliveryStatus: result.ok ? "SENT" : "FAILED" } });
  response.status(result.ok ? 200 : 502).json({ delivery: { status: result.ok ? "SENT" : "FAILED", responseCode: result.status, error: result.error } });
});

alertRouter.post("/dispatch", async (request: Request, response: Response) => {
  const parsed = dispatchSchema.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }); return; }
  const preference = await prisma.alertPreference.findUnique({ where: { organizationId_websiteId: { organizationId: request.organizationId!, websiteId: parsed.data.websiteId } } });
  if (preference && !preference.enabled) { response.json({ dispatched: 0, skipped: "DISABLED" }); return; }
  const [website, endpoints, insights] = await Promise.all([
    prisma.website.findFirst({ where: { id: parsed.data.websiteId, organizationId: request.organizationId! }, select: { id: true, domain: true } }),
    prisma.webhookEndpoint.findMany({ where: { organizationId: request.organizationId!, status: "ACTIVE" } }),
    prisma.insight.findMany({ where: { organizationId: request.organizationId!, websiteId: parsed.data.websiteId, status: InsightStatus.OPEN, severity: preference?.minimumPriority === "LOW" ? { in: ["High", "Medium", "Low"] } : preference?.minimumPriority === "MEDIUM" ? { in: ["High", "Medium"] } : "High" }, orderBy: { updatedAt: "desc" }, take: 10 }),
  ]);
  if (!website) { response.status(404).json({ error: "WEBSITE_NOT_FOUND" }); return; }
  let dispatched = 0;
  for (const endpoint of endpoints) for (const insight of insights) {
    const delivery = await prisma.alertDelivery.create({ data: { endpointId: endpoint.id, insightId: insight.id, status: "PENDING", attemptCount: 1 } }).catch(() => null);
    if (!delivery) continue;
    const result = await deliver(decryptSecret(endpoint.encryptedUrl), { type: "ai_growth.cro_alert", website: website.domain, insight: { id: insight.id, category: insight.category, priority: insight.severity, title: insight.title, page: insight.page, problem: insight.problem, recommendation: insight.recommendation, expectedImprovement: insight.expectedImprovement } });
    await prisma.alertDelivery.update({ where: { id: delivery.id }, data: { status: result.ok ? "SENT" : "FAILED", responseCode: result.status, error: result.error, deliveredAt: result.ok ? new Date() : null } });
    await prisma.webhookEndpoint.update({ where: { id: endpoint.id }, data: { lastDeliveryAt: new Date(), lastDeliveryStatus: result.ok ? "SENT" : "FAILED" } });
    if (result.ok) dispatched += 1;
  }
  response.json({ dispatched, endpoints: endpoints.length, insights: insights.length });
});
