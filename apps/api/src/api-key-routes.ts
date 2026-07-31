import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { requireAuth } from "./auth-routes";
import { requireOrganizationMember, requireOrganizationRole } from "./organization-routes";
import { writeAuditLog } from "./audit";
import { createApiSecret, encryptSecret } from "./security";
import { prisma } from "./lib/prisma";

const createKeySchema = z.object({ name: z.string().trim().min(2).max(80) });
export const apiKeyRouter = Router({ mergeParams: true });
apiKeyRouter.use(requireAuth, requireOrganizationMember);

apiKeyRouter.get("/", requireOrganizationRole("OWNER", "ADMIN"), async (request, response) => {
  const keys = await prisma.apiKey.findMany({ where: { organizationId: request.organizationId! }, select: { id: true, name: true, keyPrefix: true, lastUsedAt: true, revokedAt: true, createdAt: true }, orderBy: { createdAt: "desc" } });
  response.json({ apiKeys: keys });
});

apiKeyRouter.post("/", requireOrganizationRole("OWNER", "ADMIN"), async (request, response) => {
  const parsed = createKeySchema.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }); return; }
  try {
    const secret = createApiSecret();
    const apiKey = await prisma.apiKey.create({ data: { organizationId: request.organizationId!, name: parsed.data.name, keyPrefix: secret.slice(0, 16), encryptedSecret: encryptSecret(secret) }, select: { id: true, name: true, keyPrefix: true, createdAt: true } });
    await writeAuditLog({ organizationId: request.organizationId, userId: request.authUserId, action: "api_key.created", entityType: "api_key", entityId: apiKey.id, ipAddress: request.ip });
    response.status(201).json({ apiKey, secret, warning: "Store this secret now. It will not be shown again." });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("ENCRYPTION_KEY")) { response.status(503).json({ error: "API_KEY_ENCRYPTION_UNAVAILABLE" }); return; }
    console.error("API key creation failed", error);
    response.status(500).json({ error: "API_KEY_CREATE_FAILED" });
  }
});

apiKeyRouter.delete("/:apiKeyId", requireOrganizationRole("OWNER", "ADMIN"), async (request: Request, response: Response) => {
  const apiKeyId = typeof request.params.apiKeyId === "string" ? request.params.apiKeyId : undefined;
  if (!apiKeyId) { response.status(400).json({ error: "INVALID_API_KEY_ID" }); return; }
  const key = await prisma.apiKey.findFirst({ where: { id: apiKeyId, organizationId: request.organizationId! } });
  if (!key) { response.status(404).json({ error: "API_KEY_NOT_FOUND" }); return; }
  await prisma.apiKey.update({ where: { id: key.id }, data: { revokedAt: new Date() } });
  await writeAuditLog({ organizationId: request.organizationId, userId: request.authUserId, action: "api_key.revoked", entityType: "api_key", entityId: key.id, ipAddress: request.ip });
  response.status(204).send();
});
