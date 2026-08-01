import { Prisma, WebsiteStatus } from "@prisma/client";
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { normalizeDomain, recordTrackingEvent } from "./website-routes";
import { prisma } from "./lib/prisma";
import { publishEvent, recordAcceptedEvent, type PipelineEvent } from "./event-pipeline";
import { isPostgresEventStorageEnabled } from "./config";

const eventTypes = ["page_view", "session_start", "session_end", "form_start", "form_submit", "conversion", "click", "scroll", "custom"] as const;

export const eventSchema = z.object({
  trackingId: z.string().regex(/^trk_[a-zA-Z0-9_-]{8,100}$/),
  eventId: z.string().trim().min(8).max(128),
  eventType: z.enum(eventTypes),
  occurredAt: z.coerce.date().optional(),
  visitorId: z.string().trim().min(1).max(128),
  sessionId: z.string().trim().min(1).max(128),
  url: z.string().url().max(2048),
  referrer: z.string().url().max(2048).nullable().optional(),
  title: z.string().trim().max(300).optional(),
  properties: z.record(z.string(), z.unknown()).default({}),
  context: z.object({
    userAgent: z.string().max(1000).optional(),
    language: z.string().max(40).optional(),
    viewport: z.object({ width: z.number().int().min(0).max(10000), height: z.number().int().min(0).max(10000) }).optional(),
  }).default({}),
});

type CollectorEvent = z.infer<typeof eventSchema>;

const sensitiveKey = /password|passcode|secret|token|authorization|cookie|email|phone|mobile|address|name|ssn|social.?security|credit.?card|card.?number|ip/i;
const rateWindowMs = 60 * 1000;
const rateLimit = 120;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const seenEvents = new Map<string, number>();

export function maskValue(value: unknown, key = ""): unknown {
  if (sensitiveKey.test(key)) return "[REDACTED]";
  if (Array.isArray(value)) return value.map((item) => maskValue(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, maskValue(childValue, childKey)]));
  }
  return value;
}

export function maskUrl(value: string) {
  const url = new URL(value);
  return `${url.origin}${url.pathname}`;
}

function isAllowedOrigin(origin: string, domain: string) {
  try {
    const originHost = new URL(origin).hostname.toLowerCase();
    const normalizedDomain = normalizeDomain(domain);
    return originHost === normalizedDomain || originHost === `www.${normalizedDomain}` || normalizedDomain === `www.${originHost}`;
  } catch {
    return false;
  }
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const current = rateBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + rateWindowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  current.count += 1;
  return { allowed: current.count <= rateLimit, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
}

function isDuplicate(key: string) {
  const now = Date.now();
  for (const [eventKey, expiresAt] of seenEvents) if (expiresAt <= now) seenEvents.delete(eventKey);
  if (seenEvents.has(key)) return true;
  seenEvents.set(key, now + 24 * 60 * 60 * 1000);
  return false;
}

function validate(input: unknown, response: Response) {
  const result = eventSchema.safeParse(input);
  if (!result.success) {
    response.status(400).json({ error: "INVALID_EVENT_PAYLOAD", details: result.error.flatten() });
    return null;
  }
  return result.data;
}

export function publicEventSummary(event: CollectorEvent) {
  return {
    eventId: event.eventId,
    eventType: event.eventType,
    occurredAt: event.occurredAt?.toISOString() ?? new Date().toISOString(),
    visitorId: event.visitorId,
    sessionId: event.sessionId,
    url: maskUrl(event.url),
    referrer: event.referrer ? maskUrl(event.referrer) : null,
    title: event.title,
    properties: maskValue(event.properties),
    context: maskValue(event.context),
  };
}

export function toTrackingEventData(event: PipelineEvent) {
  return {
    websiteId: event.websiteId,
    eventId: event.eventId,
    trackingId: event.trackingId,
    eventType: event.eventType,
    occurredAt: new Date(event.occurredAt),
    visitorId: event.visitorId,
    sessionId: event.sessionId,
    url: event.url,
    referrer: event.referrer,
    title: event.title ?? null,
    properties: event.properties as Prisma.InputJsonValue,
    context: event.context as Prisma.InputJsonValue,
  };
}

export async function persistTrackingEvent(event: PipelineEvent) {
  if (!isPostgresEventStorageEnabled()) return "disabled" as const;
  try {
    await prisma.trackingEvent.create({ data: toTrackingEventData(event) });
    return "stored" as const;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return "duplicate" as const;
    throw error;
  }
}

export const collectorRouter = Router();

collectorRouter.post("/", async (request: Request, response: Response) => {
  const trackingId = typeof request.body?.trackingId === "string" ? request.body.trackingId : request.header("x-ai-growth-tracking-id");
  const input = validate({ ...request.body, trackingId }, response);
  if (!input) return;

  const rate = checkRateLimit(`${input.trackingId}:${request.ip}`);
  if (!rate.allowed) {
    response.setHeader("Retry-After", String(rate.retryAfterSeconds));
    response.status(429).json({ error: "EVENT_RATE_LIMITED", retryAfterSeconds: rate.retryAfterSeconds });
    return;
  }

  try {
    const website = await prisma.website.findUnique({ where: { trackingId: input.trackingId }, select: { id: true, domain: true, status: true, firstEventAt: true } });
    if (!website) {
      response.status(401).json({ error: "INVALID_TRACKING_ID" });
      return;
    }
    if (website.status !== WebsiteStatus.ACTIVE) {
      response.status(409).json({ error: website.status === WebsiteStatus.PAUSED ? "TRACKING_PAUSED" : "TRACKING_ARCHIVED" });
      return;
    }

    const origin = request.header("origin");
    if (origin && !isAllowedOrigin(origin, website.domain)) {
      response.status(403).json({ error: "ORIGIN_NOT_ALLOWED" });
      return;
    }

    const duplicate = isDuplicate(`${input.trackingId}:${input.eventId}`);
    if (duplicate) {
      response.json({ accepted: true, duplicate: true, eventId: input.eventId });
      return;
    }

    const maskedEvent = publicEventSummary(input);
    const firstEvent = !website.firstEventAt;
    const pipelineEvent: PipelineEvent = {
      ...maskedEvent,
      trackingId: input.trackingId,
      websiteId: website.id,
      properties: maskedEvent.properties as Record<string, unknown>,
      context: maskedEvent.context as Record<string, unknown>,
    };
    recordAcceptedEvent();
    await publishEvent(pipelineEvent);
    const persistence = await persistTrackingEvent(pipelineEvent);
    if (persistence === "duplicate") {
      response.json({ accepted: true, duplicate: true, eventId: input.eventId });
      return;
    }
    await recordTrackingEvent(website.id);
    response.status(202).json({ accepted: true, duplicate: false, firstEvent, eventId: input.eventId, websiteId: website.id, event: maskedEvent });
  } catch (error) {
    console.error("Tracking event collection failed", error);
    response.status(503).json({ error: "EVENT_COLLECTION_UNAVAILABLE" });
  }
});
