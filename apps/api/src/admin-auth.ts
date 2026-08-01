import type { NextFunction, Request, Response } from "express";
import { prisma } from "./lib/prisma";
import { writeAuditLog } from "./audit";

declare global {
  namespace Express {
    interface Request { platformAdminId?: string }
  }
}

export async function isPlatformAdmin(userId: string) {
  const admin = await prisma.platformAdmin.findUnique({ where: { userId }, select: { userId: true, revokedAt: true } });
  return Boolean(admin && !admin.revokedAt);
}

export async function requirePlatformAdmin(request: Request, response: Response, next: NextFunction) {
  if (!request.authUserId) {
    response.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }
  try {
    const admin = await prisma.platformAdmin.findUnique({ where: { userId: request.authUserId }, select: { userId: true, revokedAt: true } });
    if (!admin || admin.revokedAt) {
      await writeAuditLog({ userId: request.authUserId, action: "admin.access_denied", entityType: "platform_admin", metadata: { path: request.path, method: request.method, reason: "NOT_PLATFORM_ADMIN" }, ipAddress: request.ip });
      response.status(403).json({ error: "PLATFORM_ADMIN_ACCESS_DENIED" });
      return;
    }
    request.platformAdminId = admin.userId;
    next();
  } catch (error) {
    console.error("Platform admin authorization failed", error);
    response.status(500).json({ error: "PLATFORM_ADMIN_AUTHORIZATION_FAILED" });
  }
}
