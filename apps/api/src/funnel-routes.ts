import { Router } from "express";
import { FunnelStatus } from "@prisma/client";
import { z } from "zod";
import { requireAuth } from "./auth-routes";
import { requireOrganizationMember, requireOrganizationRole } from "./organization-routes";
import { writeAuditLog } from "./audit";
import { prisma } from "./lib/prisma";

const stepSchema = z.object({ name: z.string().trim().min(1).max(100), path: z.string().trim().min(1).max(500) });
const funnelSchema = z.object({ name: z.string().trim().min(2).max(120), description: z.string().trim().max(500).optional().default(""), goal: z.object({ type: z.enum(["conversion", "form_submit", "purchase", "custom"]), value: z.string().trim().max(120).optional() }), steps: z.array(stepSchema).min(2).max(8) }).superRefine((input, context) => { if (new Set(input.steps.map((step) => step.path)).size !== input.steps.length) context.addIssue({ code: "custom", path: ["steps"], message: "Each funnel step must use a unique path." }); if (["form_submit", "purchase", "custom"].includes(input.goal.type) && !input.goal.value) context.addIssue({ code: "custom", path: ["goal", "value"], message: "This conversion goal requires a value." }); });

export const funnelRouter = Router({ mergeParams: true });
funnelRouter.use(requireAuth, requireOrganizationMember);
function param(value: string | string[] | undefined) { return typeof value === "string" ? value : ""; }
function funnelWhere(request: { organizationId?: string; params: { websiteId?: string | string[] } }) { return { organizationId: request.organizationId!, websiteId: param(request.params.websiteId), status: FunnelStatus.ACTIVE }; }
const funnelSelect = { id: true, name: true, description: true, goalType: true, goalValue: true, status: true, createdAt: true, updatedAt: true, steps: { select: { id: true, position: true, name: true, path: true }, orderBy: { position: "asc" as const } } } as const;

funnelRouter.get("/", async (request, response) => { try { response.json({ funnels: await prisma.funnel.findMany({ where: funnelWhere(request), select: funnelSelect, orderBy: { updatedAt: "desc" } }) }); } catch (error) { console.error("Funnel list failed", error); response.status(500).json({ error: "FUNNELS_FETCH_FAILED" }); } });

funnelRouter.post("/", requireOrganizationRole("OWNER", "ADMIN", "DEVELOPER"), async (request, response) => {
  const parsed = funnelSchema.safeParse(request.body); if (!parsed.success) { response.status(400).json({ error: "INVALID_FUNNEL", details: parsed.error.flatten() }); return; }
  try { const website = await prisma.website.findFirst({ where: { id: param(request.params.websiteId), organizationId: request.organizationId! }, select: { id: true } }); if (!website) { response.status(404).json({ error: "WEBSITE_NOT_FOUND" }); return; }
    const funnel = await prisma.$transaction(async (transaction) => { const created = await transaction.funnel.create({ data: { organizationId: request.organizationId!, websiteId: website.id, name: parsed.data.name, description: parsed.data.description || null, goalType: parsed.data.goal.type, goalValue: parsed.data.goal.value || null, steps: { create: parsed.data.steps.map((step, position) => ({ position, name: step.name, path: step.path })) } }, select: funnelSelect }); await transaction.auditLog.create({ data: { organizationId: request.organizationId!, userId: request.authUserId, action: "funnel.created", entityType: "funnel", entityId: created.id, metadata: { name: created.name, stepCount: parsed.data.steps.length, goalType: parsed.data.goal.type }, ipAddress: request.ip } }); return created; }); response.status(201).json({ funnel });
  } catch (error) { console.error("Funnel create failed", error); response.status(500).json({ error: "FUNNEL_CREATE_FAILED" }); }
});

funnelRouter.patch("/:funnelId", requireOrganizationRole("OWNER", "ADMIN", "DEVELOPER"), async (request, response) => {
  const parsed = funnelSchema.safeParse(request.body); if (!parsed.success) { response.status(400).json({ error: "INVALID_FUNNEL", details: parsed.error.flatten() }); return; }
  try { const existing = await prisma.funnel.findFirst({ where: { ...funnelWhere(request), id: param(request.params.funnelId) }, select: { id: true } }); if (!existing) { response.status(404).json({ error: "FUNNEL_NOT_FOUND" }); return; }
    const funnel = await prisma.$transaction(async (transaction) => { await transaction.funnelStep.deleteMany({ where: { funnelId: existing.id } }); const updated = await transaction.funnel.update({ where: { id: existing.id }, data: { name: parsed.data.name, description: parsed.data.description || null, goalType: parsed.data.goal.type, goalValue: parsed.data.goal.value || null, steps: { create: parsed.data.steps.map((step, position) => ({ position, name: step.name, path: step.path })) } }, select: funnelSelect }); await transaction.auditLog.create({ data: { organizationId: request.organizationId!, userId: request.authUserId, action: "funnel.updated", entityType: "funnel", entityId: updated.id, metadata: { name: updated.name, stepCount: parsed.data.steps.length, goalType: parsed.data.goal.type }, ipAddress: request.ip } }); return updated; }); response.json({ funnel });
  } catch (error) { console.error("Funnel update failed", error); response.status(500).json({ error: "FUNNEL_UPDATE_FAILED" }); }
});

funnelRouter.delete("/:funnelId", requireOrganizationRole("OWNER", "ADMIN", "DEVELOPER"), async (request, response) => {
  try { const existing = await prisma.funnel.findFirst({ where: { ...funnelWhere(request), id: param(request.params.funnelId) }, select: { id: true, name: true } }); if (!existing) { response.status(404).json({ error: "FUNNEL_NOT_FOUND" }); return; } const funnel = await prisma.$transaction(async (transaction) => { const archived = await transaction.funnel.update({ where: { id: existing.id }, data: { status: FunnelStatus.ARCHIVED }, select: { id: true, name: true, status: true, updatedAt: true } }); await transaction.auditLog.create({ data: { organizationId: request.organizationId!, userId: request.authUserId, action: "funnel.archived", entityType: "funnel", entityId: existing.id, metadata: { name: existing.name }, ipAddress: request.ip } }); return archived; }); response.json({ funnel });
  } catch (error) { console.error("Funnel archive failed", error); response.status(500).json({ error: "FUNNEL_ARCHIVE_FAILED" }); }
});
