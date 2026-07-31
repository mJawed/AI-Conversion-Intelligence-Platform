import { Router, type NextFunction, type Request, type Response } from "express";
import { authenticateAccessToken, getUserById, loginSchema, loginUser, refreshSchema, refreshUser, registerSchema, registerUser, revokeRefreshToken } from "./auth";

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

authRouter.post("/register", async (request, response) => {
  const input = validate(registerSchema, request.body, response) as Parameters<typeof registerUser>[0] | null;
  if (!input) return;
  try { response.status(201).json(await registerUser(input)); } catch (error) { if (error instanceof Error && error.message === "EMAIL_ALREADY_REGISTERED") response.status(409).json({ error: "EMAIL_ALREADY_REGISTERED" }); else response.status(500).json({ error: "REGISTRATION_FAILED" }); }
});

authRouter.post("/login", async (request, response) => {
  const input = validate(loginSchema, request.body, response) as Parameters<typeof loginUser>[0] | null;
  if (!input) return;
  try { response.json(await loginUser(input)); } catch (error) { if (error instanceof Error && error.message === "INVALID_CREDENTIALS") response.status(401).json({ error: "INVALID_CREDENTIALS" }); else response.status(500).json({ error: "LOGIN_FAILED" }); }
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
