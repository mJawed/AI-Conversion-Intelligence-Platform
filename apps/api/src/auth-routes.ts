import { Router, type NextFunction, type Request, type Response } from "express";
import { authenticateAccessToken, forgotPasswordSchema, getUserById, loginSchema, loginUser, refreshSchema, refreshUser, registerSchema, registerUser, requestPasswordReset, resetPassword, resetPasswordSchema, revokeRefreshToken } from "./auth";
import { authRateLimit } from "./security";
import { isPlatformAdmin } from "./admin-auth";
import { writeAuditLog } from "./audit";

declare global { namespace Express { interface Request { authUserId?: string } } }

export const authRouter = Router();

const validate = (schema: { safeParse: (input: unknown) => { success: boolean; data?: unknown; error?: { flatten: () => unknown } } }, input: unknown, response: Response) => {
  const result = schema.safeParse(input);
  if (!result.success) { response.status(400).json({ error: "VALIDATION_ERROR", details: result.error?.flatten() }); return null; }
  return result.data;
};

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const header = request.header("authorization");
  if (!header?.startsWith("Bearer ")) { response.status(401).json({ error: "UNAUTHORIZED" }); return; }
  try { request.authUserId = authenticateAccessToken(header.slice(7)); next(); } catch { response.status(401).json({ error: "INVALID_ACCESS_TOKEN" }); }
}

authRouter.post("/register", authRateLimit, async (request, response) => {
  const input = validate(registerSchema, request.body, response) as Parameters<typeof registerUser>[0] | null;
  if (!input) return;
  try { response.status(201).json(await registerUser(input)); } catch (error) { if (error instanceof Error && error.message === "EMAIL_ALREADY_REGISTERED") response.status(409).json({ error: "EMAIL_ALREADY_REGISTERED" }); else response.status(500).json({ error: "REGISTRATION_FAILED" }); }
});

authRouter.post("/login", authRateLimit, async (request, response) => {
  const input = validate(loginSchema, request.body, response) as Parameters<typeof loginUser>[0] | null;
  if (!input) return;
  try {
    const result = await loginUser(input);
    void writeAuditLog({ userId: result.user.id, action: "auth.sign_in", entityType: "user", entityId: result.user.id, ipAddress: request.ip });
    if (await isPlatformAdmin(result.user.id)) void writeAuditLog({ userId: result.user.id, action: "admin.sign_in", entityType: "platform_admin", ipAddress: request.ip });
    response.json(result);
  } catch (error) { if (error instanceof Error && error.message === "INVALID_CREDENTIALS") response.status(401).json({ error: "INVALID_CREDENTIALS" }); else response.status(500).json({ error: "LOGIN_FAILED" }); }
});

authRouter.post("/forgot-password", authRateLimit, async (request, response) => {
  const input = validate(forgotPasswordSchema, request.body, response) as Parameters<typeof requestPasswordReset>[0] | null;
  if (!input) return;
  try { response.status(202).json(await requestPasswordReset(input)); } catch { response.status(500).json({ error: "PASSWORD_RESET_FAILED" }); }
});

authRouter.post("/reset-password", authRateLimit, async (request, response) => {
  const input = validate(resetPasswordSchema, request.body, response) as Parameters<typeof resetPassword>[0] | null;
  if (!input) return;
  try { await resetPassword(input); response.json({ message: "Password reset successfully. You can now sign in." }); }
  catch (error) { if (error instanceof Error && error.message === "INVALID_PASSWORD_RESET_TOKEN") response.status(400).json({ error: "INVALID_PASSWORD_RESET_TOKEN" }); else response.status(500).json({ error: "PASSWORD_RESET_FAILED" }); }
});

authRouter.post("/refresh", async (request, response) => {
  const input = validate(refreshSchema, request.body, response) as { refreshToken: string } | null;
  if (!input) return;
  try { response.json(await refreshUser(input.refreshToken)); } catch { response.status(401).json({ error: "INVALID_REFRESH_TOKEN" }); }
});

authRouter.post("/logout", async (request, response) => {
  const input = validate(refreshSchema, request.body, response) as { refreshToken: string } | null;
  if (!input) return;
  await revokeRefreshToken(input.refreshToken);
  response.status(204).send();
});

authRouter.get("/me", requireAuth, async (request, response) => {
  const user = await getUserById(request.authUserId!);
  if (!user) { response.status(401).json({ error: "USER_NOT_FOUND" }); return; }
  response.json({ user });
});
