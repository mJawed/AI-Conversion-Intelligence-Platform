import { OrganizationRole, type Prisma } from "@prisma/client";
import { Router, type NextFunction, type Request, type Response } from "express";
import { requireAuth } from "./auth-routes";
import { prisma } from "./lib/prisma";

declare global {
  namespace Express {
    interface Request {
      organizationId?: string;
      organizationRole?: OrganizationRole;
    }
  }
}

const roleOrder: Record<OrganizationRole, number> = {
  VIEWER: 10,
  MARKETING: 20,
  DEVELOPER: 30,
  ADMIN: 40,
  OWNER: 50,
};

const organizationSelect = {
  id: true,
  name: true,
  slug: true,
  plan: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.OrganizationSelect;

const memberSelect = {
  id: true,
  role: true,
  createdAt: true,
  user: { select: { id: true, name: true, email: true, avatar: true } },
} satisfies Prisma.OrganizationMemberSelect;

export function requireOrganizationMember(request: Request, response: Response, next: NextFunction) {
  const organizationId = typeof request.params.organizationId === "string" ? request.params.organizationId : undefined;
  const userId = request.authUserId;
  if (!organizationId || !userId) {
    response.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }

  prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
    select: { role: true, organization: { select: { status: true } } },
  }).then((membership) => {
    if (!membership) {
      response.status(403).json({ error: "ORGANIZATION_ACCESS_DENIED" });
      return;
    }
    if (membership.organization.status !== "ACTIVE") {
      response.status(403).json({ error: "ORGANIZATION_INACTIVE" });
      return;
    }
    request.organizationId = organizationId;
    request.organizationRole = membership.role;
    next();
  }).catch((error) => {
    console.error("Organization authorization failed", error);
    response.status(500).json({ error: "ORGANIZATION_AUTHORIZATION_FAILED" });
  });
}

export function requireOrganizationRole(...allowedRoles: OrganizationRole[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.organizationRole || !allowedRoles.includes(request.organizationRole)) {
      response.status(403).json({ error: "INSUFFICIENT_ORGANIZATION_ROLE" });
      return;
    }
    next();
  };
}

export const organizationRouter = Router();
organizationRouter.use(requireAuth);

organizationRouter.get("/", async (request, response) => {
  try {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId: request.authUserId!, organization: { status: "ACTIVE" } },
      select: { role: true, organization: { select: organizationSelect } },
      orderBy: { createdAt: "asc" },
    });
    response.json({ organizations: memberships.map(({ organization, role }) => ({ ...organization, role })) });
  } catch (error) {
    console.error("Organization list failed", error);
    response.status(500).json({ error: "ORGANIZATIONS_FETCH_FAILED" });
  }
});

organizationRouter.get("/:organizationId", requireOrganizationMember, async (request, response) => {
  try {
    const organization = await prisma.organization.findUnique({ select: organizationSelect, where: { id: request.organizationId! } });
    if (!organization) {
      response.status(404).json({ error: "ORGANIZATION_NOT_FOUND" });
      return;
    }
    response.json({ organization: { ...organization, role: request.organizationRole } });
  } catch (error) {
    console.error("Organization fetch failed", error);
    response.status(500).json({ error: "ORGANIZATION_FETCH_FAILED" });
  }
});

organizationRouter.get("/:organizationId/members", requireOrganizationMember, async (request, response) => {
  try {
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: request.organizationId! },
      select: memberSelect,
      orderBy: { createdAt: "asc" },
    });
    response.json({ members });
  } catch (error) {
    console.error("Organization members fetch failed", error);
    response.status(500).json({ error: "ORGANIZATION_MEMBERS_FETCH_FAILED" });
  }
});

organizationRouter.patch("/:organizationId/members/:userId", requireOrganizationMember, requireOrganizationRole("OWNER", "ADMIN"), async (request, response) => {
  const nextRole = request.body?.role as OrganizationRole;
  if (!Object.values(OrganizationRole).includes(nextRole)) {
    response.status(400).json({ error: "INVALID_ORGANIZATION_ROLE" });
    return;
  }
  if (nextRole === "OWNER") {
    response.status(400).json({ error: "OWNER_TRANSFER_REQUIRED" });
    return;
  }
  if (request.organizationRole === "ADMIN" && roleOrder[nextRole] >= roleOrder.ADMIN) {
    response.status(403).json({ error: "ROLE_CHANGE_NOT_ALLOWED" });
    return;
  }

  try {
    const targetUserId = typeof request.params.userId === "string" ? request.params.userId : undefined;
    if (!targetUserId) {
      response.status(400).json({ error: "INVALID_MEMBER_ID" });
      return;
    }
    const target = await prisma.organizationMember.findUnique({ where: { organizationId_userId: { organizationId: request.organizationId!, userId: targetUserId } } });
    if (!target) {
      response.status(404).json({ error: "ORGANIZATION_MEMBER_NOT_FOUND" });
      return;
    }
    if (target.role === "OWNER") {
      response.status(400).json({ error: "OWNER_TRANSFER_REQUIRED" });
      return;
    }
    const member = await prisma.organizationMember.update({ where: { id: target.id }, data: { role: nextRole }, select: memberSelect });
    response.json({ member });
  } catch (error) {
    console.error("Organization role update failed", error);
    response.status(500).json({ error: "ORGANIZATION_ROLE_UPDATE_FAILED" });
  }
});
