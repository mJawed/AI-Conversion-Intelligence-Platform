import { createHash, randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "./lib/prisma";

export const registerSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(255), password: z.string().min(8).max(128) });
export const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1) });
export const refreshSchema = z.object({ refreshToken: z.string().min(20) });
export const forgotPasswordSchema = z.object({ email: z.string().trim().email().max(255) });
export const resetPasswordSchema = z.object({ token: z.string().min(32).max(256), password: z.string().min(8).max(128) });

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === "replace-with-a-long-random-secret") throw new Error("JWT_SECRET is not configured");
  return secret;
};

const hashRefreshToken = (token: string) => createHash("sha256").update(token).digest("hex");
const hashPasswordResetToken = (token: string) => createHash("sha256").update(token).digest("hex");

const publicUser = (user: { id: string; name: string | null; email: string; avatar: string | null; provider: string | null; emailVerifiedAt: Date | null }) => ({ id: user.id, name: user.name, email: user.email, avatar: user.avatar, provider: user.provider, emailVerifiedAt: user.emailVerifiedAt });

async function issueTokens(userId: string) {
  const refreshToken = randomBytes(48).toString("hex");
  const refreshDays = Number(process.env.JWT_REFRESH_DAYS ?? 30);
  await prisma.refreshToken.create({ data: { userId, tokenHash: hashRefreshToken(refreshToken), expiresAt: new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000) } });
  const expiresIn = (process.env.JWT_ACCESS_TTL ?? "15m") as jwt.SignOptions["expiresIn"];
  const accessToken = jwt.sign({ sub: userId }, getSecret(), { expiresIn });
  return { accessToken, refreshToken, expiresIn };
}

export async function registerUser(input: z.infer<typeof registerSchema>) {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("EMAIL_ALREADY_REGISTERED");
  const passwordHash = await bcrypt.hash(input.password, 12);
  const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "organization"}-${randomUUID().slice(0, 8)}`;
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { name: input.name, email, passwordHash } });
    const organization = await tx.organization.create({ data: { ownerId: user.id, name: `${input.name}'s Organization`, slug } });
    await tx.organizationMember.create({ data: { organizationId: organization.id, userId: user.id, role: "OWNER" } });
    return user;
  });
  return { user: publicUser(result), tokens: await issueTokens(result.id) };
}

export async function loginUser(input: z.infer<typeof loginSchema>) {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user?.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) throw new Error("INVALID_CREDENTIALS");
  return { user: publicUser(user), tokens: await issueTokens(user.id) };
}

export async function refreshUser(refreshToken: string) {
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashRefreshToken(refreshToken) }, include: { user: true } });
  if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) throw new Error("INVALID_REFRESH_TOKEN");
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  return { user: publicUser(stored.user), tokens: await issueTokens(stored.userId) };
}

export async function revokeRefreshToken(refreshToken: string) {
  await prisma.refreshToken.updateMany({ where: { tokenHash: hashRefreshToken(refreshToken), revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function requestPasswordReset(input: z.infer<typeof forgotPasswordSchema>) {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  const response: { message: string; resetToken?: string; resetUrl?: string } = {
    message: "If an account exists for that email, reset instructions will be sent.",
  };

  // Keep the response identical for unknown emails and passwordless OAuth accounts.
  if (!user?.passwordHash) return response;

  const token = randomBytes(48).toString("hex");
  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashPasswordResetToken(token), expiresAt: new Date(Date.now() + 30 * 60 * 1000) } }),
  ]);

  // Email delivery is intentionally not faked. During local development, return a link
  // so the flow can be tested without paying for an email provider.
  if (process.env.NODE_ENV !== "production") {
    const dashboardUrl = process.env.DASHBOARD_URL ?? "http://localhost:3000";
    response.resetToken = token;
    response.resetUrl = `${dashboardUrl}/reset-password?token=${token}`;
  }
  return response;
}

export async function resetPassword(input: z.infer<typeof resetPasswordSchema>) {
  const stored = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashPasswordResetToken(input.token) }, include: { user: true } });
  if (!stored || stored.usedAt || stored.expiresAt <= new Date() || !stored.user.passwordHash) throw new Error("INVALID_PASSWORD_RESET_TOKEN");

  const passwordHash = await bcrypt.hash(input.password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: stored.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: stored.id }, data: { usedAt: new Date() } }),
    prisma.refreshToken.updateMany({ where: { userId: stored.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user ? publicUser(user) : null;
}

export function authenticateAccessToken(token: string) {
  const payload = jwt.verify(token, getSecret()) as jwt.JwtPayload;
  if (typeof payload.sub !== "string") throw new Error("INVALID_ACCESS_TOKEN");
  return payload.sub;
}
