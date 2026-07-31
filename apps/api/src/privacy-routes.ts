import { Router } from "express";
import { PrivacyRequestType } from "@prisma/client";
import { z } from "zod";
import { requireAuth } from "./auth-routes";
import { writeAuditLog } from "./audit";
import { requireOrganizationMember } from "./organization-routes";
import { prisma } from "./lib/prisma";

const requestSchema = z.object({ organizationId: z.string().uuid(), type: z.nativeEnum(PrivacyRequestType) });
export const privacyRouter = Router();
privacyRouter.use(requireAuth);

privacyRouter.get("/export", async (request, response) => {
  const organizationId = typeof request.query.organizationId === "string" ? request.query.organizationId : undefined;
  if (!organizationId) { response.status(400).json({ error: "ORGANIZATION_ID_REQUIRED" }); return; }
  const membership = await prisma.organizationMember.findUnique({ where: { organizationId_userId: { organizationId, userId: request.authUserId! } }, select: { role: true } });
  if (!membership) { response.status(403).json({ error: "ORGANIZATION_ACCESS_DENIED" }); return; }
  const data = await prisma.organization.findUnique({ where: { id: organizationId }, select: { id: true, name: true, slug: true, plan: true, createdAt: true, websites: { select: { id: true, name: true, domain: true, trackingId: true, status: true, createdAt: true } }, members: { select: { role: true, createdAt: true, user: { select: { id: true, name: true, email: true } } } } } });
  await writeAuditLog({ organizationId, userId: request.authUserId, action: "privacy.exported", entityType: "organization", entityId: organizationId, ipAddress: request.ip });
  response.json({ exportedAt: new Date().toISOString(), data });
});

privacyRouter.post("/requests", async (request, response) => {
  const parsed = requestSchema.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }); return; }
  const membership = await prisma.organizationMember.findUnique({ where: { organizationId_userId: { organizationId: parsed.data.organizationId, userId: request.authUserId! } }, select: { role: true } });
  if (!membership) { response.status(403).json({ error: "ORGANIZATION_ACCESS_DENIED" }); return; }
  const privacyRequest = await prisma.privacyRequest.create({ data: { organizationId: parsed.data.organizationId, userId: request.authUserId!, type: parsed.data.type } });
  await writeAuditLog({ organizationId: parsed.data.organizationId, userId: request.authUserId, action: `privacy.${parsed.data.type.toLowerCase()}_requested`, entityType: "privacy_request", entityId: privacyRequest.id, ipAddress: request.ip });
  response.status(202).json({ request: privacyRequest });
});

privacyRouter.get("/requests", async (request, response) => {
  const organizationId = typeof request.query.organizationId === "string" ? request.query.organizationId : undefined;
  if (!organizationId) { response.status(400).json({ error: "ORGANIZATION_ID_REQUIRED" }); return; }
  const requests = await prisma.privacyRequest.findMany({ where: { organizationId, userId: request.authUserId! }, orderBy: { createdAt: "desc" } });
  response.json({ requests });
});

export const organizationPrivacyRouter = Router({ mergeParams: true });
organizationPrivacyRouter.use(requireAuth, requireOrganizationMember);
organizationPrivacyRouter.get("/audit-logs", async (request, response) => {
  const logs = await prisma.auditLog.findMany({ where: { organizationId: request.organizationId! }, select: { id: true, action: true, entityType: true, entityId: true, metadata: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 100 });
  response.json({ auditLogs: logs });
});
