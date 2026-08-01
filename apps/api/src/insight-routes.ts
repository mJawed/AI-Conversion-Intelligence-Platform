import { InsightStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "./auth-routes";
import { writeAuditLog } from "./audit";
import { requireOrganizationMember, requireOrganizationRole } from "./organization-routes";
import { prisma } from "./lib/prisma";

export const insightRouter = Router({ mergeParams: true });
insightRouter.use(requireAuth, requireOrganizationMember, requireOrganizationRole("OWNER", "ADMIN", "MARKETING"));

insightRouter.patch("/:insightId/status", async (request, response) => {
  const parsed = z.object({ status: z.nativeEnum(InsightStatus) }).safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ error: "INVALID_INSIGHT_STATUS", details: parsed.error.flatten() }); return; }
  try {
    const websiteId = typeof (request.params as Record<string, string | string[]>).websiteId === "string" ? (request.params as Record<string, string>).websiteId : "";
    const existing = await prisma.insight.findFirst({ where: { id: request.params.insightId, organizationId: request.organizationId!, websiteId }, select: { id: true, status: true } });
    if (!existing) { response.status(404).json({ error: "INSIGHT_NOT_FOUND" }); return; }
    const insight = await prisma.insight.update({ where: { id: existing.id }, data: { status: parsed.data.status, resolvedAt: parsed.data.status === InsightStatus.OPEN ? null : new Date() }, select: { id: true, status: true, resolvedAt: true, updatedAt: true } });
    await writeAuditLog({ organizationId: request.organizationId, userId: request.authUserId, action: "insight.status_updated", entityType: "insight", entityId: insight.id, metadata: { previousStatus: existing.status, nextStatus: insight.status }, ipAddress: request.ip });
    response.json({ insight });
  } catch (error) { console.error("Insight status update failed", error); response.status(500).json({ error: "INSIGHT_STATUS_UPDATE_FAILED" }); }
});
