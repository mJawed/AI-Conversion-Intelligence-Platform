import { OrganizationStatus, Prisma } from "@prisma/client";
import { Router as ExpressRouter } from "express";
import { z } from "zod";
import { requireAuth } from "./auth-routes";
import { requirePlatformAdmin } from "./admin-auth";
import { writeAuditLog } from "./audit";
import { getEventRetentionDays, getMaxTrackingEventsPerDay } from "./config";
import { prisma } from "./lib/prisma";

export const adminRouter = ExpressRouter();
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

const customerQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  plan: z.string().trim().max(30).optional(),
  status: z.nativeEnum(OrganizationStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

function customerWhere(query: z.infer<typeof customerQuerySchema>): Prisma.OrganizationWhereInput {
  const search = query.q ? [{ name: { contains: query.q, mode: "insensitive" as const } }, { slug: { contains: query.q, mode: "insensitive" as const } }, { owner: { email: { contains: query.q, mode: "insensitive" as const } } }, { owner: { name: { contains: query.q, mode: "insensitive" as const } } }, { members: { some: { user: { email: { contains: query.q, mode: "insensitive" as const } } } } }, { websites: { some: { domain: { contains: query.q, mode: "insensitive" as const } } } }] : undefined;
  return { ...(query.plan ? { plan: query.plan } : {}), ...(query.status ? { status: query.status } : {}), ...(search ? { OR: search } : {}) };
}

const customerSummarySelect = {
  id: true,
  name: true,
  slug: true,
  plan: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: { id: true, name: true, email: true } },
  _count: { select: { members: true, websites: true } },
} satisfies Prisma.OrganizationSelect;

adminRouter.get("/customers", async (request, response) => {
  const parsed = customerQuerySchema.safeParse(request.query);
  if (!parsed.success) { response.status(400).json({ error: "INVALID_CUSTOMER_QUERY", details: parsed.error.flatten() }); return; }
  const query = parsed.data;
  const where = customerWhere(query);
  const skip = (query.page - 1) * query.limit;
  try {
    const [total, organizations] = await Promise.all([
      prisma.organization.count({ where }),
      prisma.organization.findMany({ where, select: customerSummarySelect, orderBy: { createdAt: "desc" }, skip, take: query.limit }),
    ]);
    const customers = await Promise.all(organizations.map(async (organization) => {
      const lastEvent = await prisma.trackingEvent.findFirst({ where: { website: { organizationId: organization.id } }, orderBy: { occurredAt: "desc" }, select: { occurredAt: true } });
      return { ...organization, memberCount: organization._count.members, websiteCount: organization._count.websites, lastActivityAt: lastEvent?.occurredAt ?? null, _count: undefined };
    }));
    await writeAuditLog({ userId: request.platformAdminId, action: "admin.customers_listed", entityType: "organization", metadata: { query: { q: query.q, plan: query.plan, status: query.status, page: query.page, limit: query.limit } }, ipAddress: request.ip });
    response.json({ customers, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } });
  } catch (error) {
    console.error("Admin customer list failed", error);
    response.status(500).json({ error: "ADMIN_CUSTOMERS_FETCH_FAILED" });
  }
});

adminRouter.get("/customers/:organizationId", async (request, response) => {
  const organizationId = typeof request.params.organizationId === "string" ? request.params.organizationId : "";
  if (!organizationId) { response.status(400).json({ error: "INVALID_ORGANIZATION_ID" }); return; }
  try {
    const organization = await prisma.organization.findUnique({ where: { id: organizationId }, select: {
      id: true, name: true, slug: true, plan: true, status: true, createdAt: true, updatedAt: true,
      owner: { select: { id: true, name: true, email: true, createdAt: true } },
      members: { select: { id: true, role: true, createdAt: true, user: { select: { id: true, name: true, email: true, createdAt: true } } }, orderBy: { createdAt: "asc" } },
      websites: { select: { id: true, name: true, domain: true, trackingId: true, status: true, installationStatus: true, createdAt: true, lastEventAt: true }, orderBy: { createdAt: "asc" } },
    } });
    if (!organization) { response.status(404).json({ error: "CUSTOMER_NOT_FOUND" }); return; }
    const [eventCount, lastEvent] = await Promise.all([
      prisma.trackingEvent.count({ where: { website: { organizationId } } }),
      prisma.trackingEvent.findFirst({ where: { website: { organizationId } }, orderBy: { occurredAt: "desc" }, select: { occurredAt: true } }),
    ]);
    await writeAuditLog({ userId: request.platformAdminId, action: "admin.customer_viewed", entityType: "organization", entityId: organizationId, ipAddress: request.ip });
    response.json({ customer: { ...organization, usage: { events: eventCount, lastActivityAt: lastEvent?.occurredAt ?? null } } });
  } catch (error) {
    console.error("Admin customer detail failed", error);
    response.status(500).json({ error: "ADMIN_CUSTOMER_FETCH_FAILED" });
  }
});

const usageQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

adminRouter.get("/usage", async (request, response) => {
  const parsed = usageQuerySchema.safeParse(request.query);
  if (!parsed.success) { response.status(400).json({ error: "INVALID_USAGE_QUERY", details: parsed.error.flatten() }); return; }
  let range: { from: Date; to: Date };
  try { range = getOverviewRange(parsed.data); }
  catch { response.status(400).json({ error: "INVALID_DATE_RANGE" }); return; }
  const eventOrganizationFilter = parsed.data.organizationId ? Prisma.sql`AND w.organization_id = ${parsed.data.organizationId}::uuid` : Prisma.empty;
  const auditOrganizationFilter = parsed.data.organizationId ? Prisma.sql`AND a.organization_id = ${parsed.data.organizationId}::uuid` : Prisma.empty;
  try {
    const [daily, organizations, auditActivity, storage] = await Promise.all([
      prisma.$queryRaw<Array<{ day: string; events: number; visitors: number; sessions: number }>>(Prisma.sql`SELECT TO_CHAR(DATE_TRUNC('day', e.occurred_at), 'YYYY-MM-DD') AS day, COUNT(e.id)::int AS events, COUNT(DISTINCT e.visitor_id)::int AS visitors, COUNT(DISTINCT e.session_id)::int AS sessions FROM tracking_events e JOIN websites w ON w.id = e.website_id WHERE e.occurred_at >= ${range.from} AND e.occurred_at < ${range.to} ${eventOrganizationFilter} GROUP BY DATE_TRUNC('day', e.occurred_at) ORDER BY day ASC`),
      prisma.$queryRaw<Array<{ organization_id: string; organization_name: string; plan: string; events: number; visitors: number; sessions: number }>>(Prisma.sql`SELECT o.id AS organization_id, o.name AS organization_name, o.plan, COUNT(e.id)::int AS events, COUNT(DISTINCT e.visitor_id)::int AS visitors, COUNT(DISTINCT e.session_id)::int AS sessions FROM organizations o JOIN websites w ON w.organization_id = o.id JOIN tracking_events e ON e.website_id = w.id WHERE e.occurred_at >= ${range.from} AND e.occurred_at < ${range.to} ${eventOrganizationFilter} GROUP BY o.id, o.name, o.plan ORDER BY events DESC LIMIT 100`),
      prisma.$queryRaw<Array<{ day: string; audit_events: number }>>(Prisma.sql`SELECT TO_CHAR(DATE_TRUNC('day', a.created_at), 'YYYY-MM-DD') AS day, COUNT(a.id)::int AS audit_events FROM audit_logs a WHERE a.created_at >= ${range.from} AND a.created_at < ${range.to} ${auditOrganizationFilter} GROUP BY DATE_TRUNC('day', a.created_at) ORDER BY day ASC`),
      prisma.$queryRaw<Array<{ bytes: bigint }>>(Prisma.sql`SELECT pg_total_relation_size('tracking_events')::bigint AS bytes`),
    ]);
    const dailyEventLimit = getMaxTrackingEventsPerDay();
    const warningThreshold = Math.floor(dailyEventLimit * 0.8);
    const dailyUsage = daily.map((row) => ({ ...row, warning: Number(row.events) >= warningThreshold }));
    await writeAuditLog({ userId: request.platformAdminId, action: "admin.usage_viewed", entityType: "platform_admin", metadata: { organizationId: parsed.data.organizationId, from: range.from.toISOString(), to: range.to.toISOString() }, ipAddress: request.ip });
    response.json({ usage: {
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      daily: dailyUsage,
      organizations,
      apiActivity: auditActivity,
      storage: { trackingEventsBytes: Number(storage[0]?.bytes ?? 0) },
      thresholds: { dailyEventLimit, dailyEventWarningAt: warningThreshold, eventRetentionDays: getEventRetentionDays() },
    } });
  } catch (error) {
    console.error("Admin usage report failed", error);
    response.status(500).json({ error: "ADMIN_USAGE_FETCH_FAILED" });
  }
});
