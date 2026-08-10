import { ExperimentStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "./auth-routes";
import { writeAuditLog } from "./audit";
import { requireOrganizationMember, requireOrganizationRole } from "./organization-routes";
import { prisma } from "./lib/prisma";

export const experimentRouter = Router({ mergeParams: true });
experimentRouter.use(requireAuth, requireOrganizationMember);

const experimentFields = {
  name: z.string().trim().min(2).max(120),
  hypothesis: z.string().trim().min(10).max(1000),
  targetPage: z.string().trim().min(1).max(500),
  variant: z.string().trim().min(1).max(500),
  primaryMetric: z.string().trim().min(1).max(120),
  status: z.nativeEnum(ExperimentStatus).default(ExperimentStatus.PLANNED),
  baselineValue: z.string().trim().max(120).nullable().optional(),
  resultValue: z.string().trim().max(120).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  insightId: z.string().uuid().nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
};
const createExperimentSchema = z.object(experimentFields);
const updateExperimentSchema = z.object({ ...experimentFields, status: z.nativeEnum(ExperimentStatus).optional() }).partial();

function websiteIdOf(request: { params: Record<string, string | string[]> }) {
  const value = request.params.websiteId;
  return typeof value === "string" ? value : "";
}

function experimentIdOf(request: { params: Record<string, string | string[]> }) {
  const value = request.params.experimentId;
  return typeof value === "string" ? value : "";
}

async function validateReferences(organizationId: string, websiteId: string, input: { insightId?: string | null; ownerId?: string | null }) {
  if (input.insightId) {
    const insight = await prisma.insight.findFirst({ where: { id: input.insightId, organizationId, websiteId }, select: { id: true } });
    if (!insight) return "EXPERIMENT_INSIGHT_NOT_FOUND";
  }
  if (input.ownerId) {
    const member = await prisma.organizationMember.findUnique({ where: { organizationId_userId: { organizationId, userId: input.ownerId } }, select: { userId: true } });
    if (!member) return "EXPERIMENT_OWNER_NOT_MEMBER";
  }
  return null;
}

function timestamps(status: ExperimentStatus | undefined, existing?: { startedAt: Date | null; endedAt: Date | null }) {
  return {
    ...(status === ExperimentStatus.RUNNING && !existing?.startedAt ? { startedAt: new Date() } : {}),
    ...(status === ExperimentStatus.COMPLETED && !existing?.endedAt ? { endedAt: new Date() } : {}),
    ...(status !== ExperimentStatus.COMPLETED ? { endedAt: null } : {}),
  };
}

experimentRouter.get("/", async (request, response) => {
  const organizationId = request.organizationId!;
  const websiteId = websiteIdOf(request);
  const experiments = await prisma.experiment.findMany({
    where: { organizationId, websiteId },
    orderBy: { updatedAt: "desc" },
    include: { insight: { select: { id: true, title: true, page: true, expectedImprovement: true } } },
  });
  response.json({ experiments });
});

experimentRouter.post("/", requireOrganizationRole("OWNER", "ADMIN", "DEVELOPER", "MARKETING"), async (request, response) => {
  const parsed = createExperimentSchema.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ error: "INVALID_EXPERIMENT", details: parsed.error.flatten() }); return; }
  const organizationId = request.organizationId!;
  const websiteId = websiteIdOf(request);
  const referenceError = await validateReferences(organizationId, websiteId, parsed.data);
  if (referenceError) { response.status(400).json({ error: referenceError }); return; }
  try {
    const { status, insightId, ownerId, ...fields } = parsed.data;
    const experiment = await prisma.experiment.create({ data: { ...fields, status, insightId: insightId ?? null, ownerId: ownerId ?? request.authUserId, organizationId, websiteId, ...timestamps(status) }, include: { insight: { select: { id: true, title: true, page: true, expectedImprovement: true } } } });
    await writeAuditLog({ organizationId, userId: request.authUserId, action: "experiment.created", entityType: "experiment", entityId: experiment.id, metadata: { status: experiment.status, insightId: experiment.insightId }, ipAddress: request.ip });
    response.status(201).json({ experiment });
  } catch (error) { console.error("Experiment creation failed", error); response.status(500).json({ error: "EXPERIMENT_CREATE_FAILED" }); }
});

experimentRouter.patch("/:experimentId", requireOrganizationRole("OWNER", "ADMIN", "DEVELOPER", "MARKETING"), async (request, response) => {
  const parsed = updateExperimentSchema.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ error: "INVALID_EXPERIMENT", details: parsed.error.flatten() }); return; }
  const organizationId = request.organizationId!;
  const websiteId = websiteIdOf(request);
  const existing = await prisma.experiment.findFirst({ where: { id: experimentIdOf(request), organizationId, websiteId }, select: { id: true, status: true, startedAt: true, endedAt: true } });
  if (!existing) { response.status(404).json({ error: "EXPERIMENT_NOT_FOUND" }); return; }
  const referenceError = await validateReferences(organizationId, websiteId, parsed.data);
  if (referenceError) { response.status(400).json({ error: referenceError }); return; }
  try {
    const { status, insightId, ownerId, ...fields } = parsed.data;
    const nextStatus = status ?? existing.status;
    const experiment = await prisma.experiment.update({ where: { id: existing.id }, data: { ...fields, ...(insightId !== undefined ? { insightId } : {}), ...(ownerId !== undefined ? { ownerId } : {}), ...(status ? { status } : {}), ...timestamps(nextStatus, existing) }, include: { insight: { select: { id: true, title: true, page: true, expectedImprovement: true } } } });
    await writeAuditLog({ organizationId, userId: request.authUserId, action: "experiment.updated", entityType: "experiment", entityId: experiment.id, metadata: { previousStatus: existing.status, nextStatus: experiment.status }, ipAddress: request.ip });
    response.json({ experiment });
  } catch (error) { console.error("Experiment update failed", error); response.status(500).json({ error: "EXPERIMENT_UPDATE_FAILED" }); }
});

experimentRouter.delete("/:experimentId", requireOrganizationRole("OWNER", "ADMIN", "DEVELOPER", "MARKETING"), async (request, response) => {
  const organizationId = request.organizationId!;
  const websiteId = websiteIdOf(request);
  const existing = await prisma.experiment.findFirst({ where: { id: experimentIdOf(request), organizationId, websiteId }, select: { id: true, status: true } });
  if (!existing) { response.status(404).json({ error: "EXPERIMENT_NOT_FOUND" }); return; }
  const experiment = await prisma.experiment.update({ where: { id: existing.id }, data: { status: ExperimentStatus.ARCHIVED, endedAt: new Date() }, select: { id: true, status: true, endedAt: true } });
  await writeAuditLog({ organizationId, userId: request.authUserId, action: "experiment.archived", entityType: "experiment", entityId: experiment.id, metadata: { previousStatus: existing.status }, ipAddress: request.ip });
  response.json({ experiment });
});
