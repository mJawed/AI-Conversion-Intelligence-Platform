import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "./auth-routes";
import { requirePlatformAdmin } from "./admin-auth";
import { writeAuditLog } from "./audit";
import { prisma } from "./lib/prisma";

export const adminRouter = Router();
adminRouter.use(requireAuth, requirePlatformAdmin);

adminRouter.get("/access", async (request, response) => {
  await writeAuditLog({ userId: request.platformAdminId, action: "admin.access_granted", entityType: "platform_admin", metadata: { path: request.path, method: request.method }, ipAddress: request.ip });
  response.json({ admin: { userId: request.platformAdminId, access: "platform" } });
});

const overviewQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

function getOverviewRange(query: unknown) {
  const parsed = overviewQuerySchema.safeParse(query);
  if (!parsed.success) throw new Error("INVALID_DATE_RANGE");
  const to = parsed.data.to ? new Date(parsed.data.to) : new Date();
  const from = parsed.data.from ? new Date(parsed.data.from) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (from >= to) throw new Error("INVALID_DATE_RANGE");
  return { from, to };
}

adminRouter.get("/overview", async (request, response) => {
  let range: { from: Date; to: Date };
  try { range = getOverviewRange(request.query); }
  catch { response.status(400).json({ error: "INVALID_DATE_RANGE" }); return; }

  try {
    const activityWhere = { createdAt: { gte: range.from, lt: range.to } };
    const [totalUsers, activeUserRows, newUsers, totalOrganizations, activeOrganizationRows, newOrganizations, freeOrganizations, paidOrganizations, totalWebsites, eventCount] = await Promise.all([
      prisma.user.count(),
      prisma.auditLog.groupBy({ by: ["userId"], where: { ...activityWhere, action: "auth.sign_in", userId: { not: null } } }),
      prisma.user.count({ where: { createdAt: activityWhere.createdAt } }),
      prisma.organization.count(),
      prisma.trackingEvent.groupBy({ by: ["websiteId"], where: { occurredAt: { gte: range.from, lt: range.to } } }),
      prisma.organization.count({ where: { createdAt: activityWhere.createdAt } }),
      prisma.organization.count({ where: { plan: "FREE" } }),
      prisma.organization.count({ where: { plan: { not: "FREE" } } }),
      prisma.website.count(),
      prisma.trackingEvent.count({ where: { occurredAt: { gte: range.from, lt: range.to } } }),
    ]);
    const activeWebsiteIds = [...new Set(activeOrganizationRows.map((row) => row.websiteId))];
    const activeWebsites = activeWebsiteIds.length ? await prisma.website.findMany({ where: { id: { in: activeWebsiteIds } }, select: { organizationId: true } }) : [];
    const activeOrganizations = new Set(activeWebsites.map((website) => website.organizationId));
    await writeAuditLog({ userId: request.platformAdminId, action: "admin.overview_viewed", entityType: "platform_admin", metadata: { from: range.from.toISOString(), to: range.to.toISOString() }, ipAddress: request.ip });
    response.json({ overview: {
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      users: { total: totalUsers, active: activeUserRows.length, new: newUsers },
      organizations: { total: totalOrganizations, active: activeOrganizations.size, free: freeOrganizations, paid: paidOrganizations, new: newOrganizations },
      websites: { total: totalWebsites },
      events: { total: eventCount },
    } });
  } catch (error) {
    console.error("Admin overview failed", error);
    response.status(500).json({ error: "ADMIN_OVERVIEW_FAILED" });
  }
});
