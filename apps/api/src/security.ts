import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { recordRequest } from "./observability";

const authBuckets = new Map<string, { count: number; resetAt: number }>();

export function authRateLimit(request: Request, response: Response, next: NextFunction) {
  const key = request.ip ?? "unknown";
  const now = Date.now();
  const current = authBuckets.get(key);
  if (!current || current.resetAt <= now) {
    authBuckets.set(key, { count: 1, resetAt: now + 5 * 60 * 1000 });
    next();
    return;
  }
  current.count += 1;
  if (current.count > 20) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);
    response.setHeader("Retry-After", String(retryAfter));
    response.status(429).json({ error: "AUTH_RATE_LIMITED", retryAfterSeconds: retryAfter });
    return;
  }
  next();
}

function encryptionKey() {
  const value = process.env.ENCRYPTION_KEY;
  if (!value || !/^[a-f0-9]{64}$/i.test(value)) throw new Error("ENCRYPTION_KEY is not configured as a 32-byte hex key");
  return Buffer.from(value, "hex");
}

export function encryptSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(value: string) {
  const [ivHex, tagHex, encryptedHex] = value.split(":");
  if (!ivHex || !tagHex || !encryptedHex) throw new Error("INVALID_ENCRYPTED_SECRET");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final()]).toString("utf8");
}

export function createApiSecret() {
  return `ag_live_${randomBytes(32).toString("hex")}`;
}

export function writeSafeRequestLog(request: Request, response: Response, startedAt: number) {
  const durationMs = Date.now() - startedAt;
  recordRequest(durationMs, response.statusCode);
  console.info(JSON.stringify({
    requestId: request.header("x-request-id") ?? randomBytes(8).toString("hex"),
    method: request.method,
    path: request.path,
    status: response.statusCode,
    durationMs,
    ip: request.ip,
  }));
}
