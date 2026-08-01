import { Router } from "express";
import { requireAuth } from "./auth-routes";
import { requirePlatformAdmin } from "./admin-auth";
import { writeAuditLog } from "./audit";

export const adminRouter = Router();
adminRouter.use(requireAuth, requirePlatformAdmin);

adminRouter.get("/access", async (request, response) => {
  await writeAuditLog({ userId: request.platformAdminId, action: "admin.access_granted", entityType: "platform_admin", metadata: { path: request.path, method: request.method }, ipAddress: request.ip });
  response.json({ admin: { userId: request.platformAdminId, access: "platform" } });
});
