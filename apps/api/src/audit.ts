import { Prisma } from "@prisma/client";
import { prisma } from "./lib/prisma";

export async function writeAuditLog(input: { organizationId?: string; userId?: string; action: string; entityType: string; entityId?: string; metadata?: Record<string, unknown>; ipAddress?: string }) {
  return prisma.auditLog.create({ data: { organizationId: input.organizationId, userId: input.userId, action: input.action, entityType: input.entityType, entityId: input.entityId, metadata: input.metadata as Prisma.InputJsonValue | undefined, ipAddress: input.ipAddress } });
}
