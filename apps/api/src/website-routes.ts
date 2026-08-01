import { randomBytes } from "node:crypto";
import { Prisma, WebsiteStatus } from "@prisma/client";
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { requireAuth } from "./auth-routes";
import { requireOrganizationMember, requireOrganizationRole } from "./organization-routes";
import { prisma } from "./lib/prisma";

const websiteCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  domain: z.string().trim().min(3).max(255),
  timezone: z.string().trim().min(1).max(80).default("UTC"),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default("USD"),
  industry: z.string().trim().max(100).nullable().optional(),
});

const websiteUpdateSchema = websiteCreateSchema.partial();

const websiteSelect = {
  id: true,
  organizationId: true,
  name: true,
  domain: true,
  trackingId: true,
  timezone: true,
  currency: true,
  industry: true,
  status: true,
  installationStatus: true,
  trackingVerifiedAt: true,
  firstEventAt: true,
  lastEventAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.WebsiteSelect;

export function normalizeDomain(value: string) {
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const url = new URL(candidate);
  if (!url.hostname || url.pathname !== "/" || url.search || url.hash) throw new Error("INVALID_DOMAIN");
  return url.hostname.toLowerCase();
}

export function getTrackingVerificationStatus(website: { status: WebsiteStatus; firstEventAt: Date | null }) {
  if (website.status === WebsiteStatus.PAUSED) return { verified: false, status: "TRACKING_PAUSED", message: "Tracking is paused for this website." } as const;
  if (website.status === WebsiteStatus.ARCHIVED) return { verified: false, status: "TRACKING_ARCHIVED", message: "Tracking is unavailable for an archived website." } as const;
  if (!website.firstEventAt) return { verified: false, status: "TRACKING_NOT_DETECTED", message: "No tracking event has been received yet." } as const;
  return { verified: true, status: "TRACKING_VERIFIED", message: "Tracking is connected and receiving events." } as const;
}

function createTrackingId() {
  return `trk_${randomBytes(12).toString("hex")}`;
}

function validate(schema: typeof websiteCreateSchema | typeof websiteUpdateSchema, input: unknown, response: Response) {
  const result = schema.safeParse(input);
  if (!result.success) {
    response.status(400).json({ error: "VALIDATION_ERROR", details: result.error.flatten() });
    return null;
  }
  return result.data;
}

async function findWebsite(request: Request) {
  const websiteId = typeof request.params.websiteId === "string" ? request.params.websiteId : undefined;
  if (!websiteId || !request.organizationId) return null;
  return prisma.website.findFirst({ where: { id: websiteId, organizationId: request.organizationId }, select: websiteSelect });
}

const verificationWindowMs = 10 * 60 * 1000;
const verificationLimit = 5;
const verificationAttempts = new Map<string, { count: number; windowStartedAt: number }>();

function checkVerificationRateLimit(key: string) {
  const now = Date.now();
  const current = verificationAttempts.get(key);
  if (!current || now - current.windowStartedAt >= verificationWindowMs) {
    verificationAttempts.set(key, { count: 1, windowStartedAt: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= verificationLimit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((verificationWindowMs - (now - current.windowStartedAt)) / 1000) };
  }
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export const websiteRouter = Router({ mergeParams: true });
websiteRouter.use(requireAuth, requireOrganizationMember);

websiteRouter.get("/", async (request, response) => {
  try {
    const websites = await prisma.website.findMany({
      where: { organizationId: request.organizationId! },
      select: websiteSelect,
      orderBy: { createdAt: "asc" },
    });
    response.json({ websites });
  } catch (error) {
    console.error("Website list failed", error);
    response.status(500).json({ error: "WEBSITES_FETCH_FAILED" });
  }
});

websiteRouter.post("/", requireOrganizationRole("OWNER", "ADMIN", "DEVELOPER"), async (request, response) => {
  const input = validate(websiteCreateSchema, request.body, response) as z.infer<typeof websiteCreateSchema> | null;
  if (!input) return;
  let domain: string;
  try {
    domain = normalizeDomain(input.domain);
  } catch {
    response.status(400).json({ error: "INVALID_DOMAIN" });
    return;
  }

  try {
    let website;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        website = await prisma.website.create({
          data: {
            organizationId: request.organizationId!,
            name: input.name,
            domain,
            trackingId: createTrackingId(),
            timezone: input.timezone,
            currency: input.currency,
            industry: input.industry ?? null,
          },
          select: websiteSelect,
        });
        break;
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002" || attempt === 2) throw error;
      }
    }
    response.status(201).json({ website });
  } catch (error) {
    console.error("Website creation failed", error);
    response.status(500).json({ error: "WEBSITE_CREATE_FAILED" });
  }
});

websiteRouter.get("/:websiteId", async (request, response) => {
  try {
    const website = await findWebsite(request);
    if (!website) {
      response.status(404).json({ error: "WEBSITE_NOT_FOUND" });
      return;
    }
    response.json({ website });
  } catch (error) {
    console.error("Website fetch failed", error);
    response.status(500).json({ error: "WEBSITE_FETCH_FAILED" });
  }
});

websiteRouter.get("/:websiteId/tracking-script", async (request, response) => {
  try {
    const website = await findWebsite(request);
    if (!website) {
      response.status(404).json({ error: "WEBSITE_NOT_FOUND" });
      return;
    }
    const scriptUrl = process.env.TRACKING_SCRIPT_URL ?? "http://localhost:4000/tracker.js";
    response.json({
      tracking: {
        trackingId: website.trackingId,
        scriptUrl,
        websiteStatus: website.status,
        installationStatus: website.installationStatus,
        verifiedAt: website.trackingVerifiedAt,
        firstEventAt: website.firstEventAt,
        snippet: `<script async src="${scriptUrl}" data-tracking-id="${website.trackingId}"></script>`,
      },
    });
  } catch (error) {
    console.error("Tracking script configuration failed", error);
    response.status(500).json({ error: "TRACKING_CONFIG_FETCH_FAILED" });
  }
});

websiteRouter.post("/:websiteId/verify", requireOrganizationRole("OWNER", "ADMIN", "DEVELOPER"), async (request, response) => {
  const key = `${request.authUserId}:${request.organizationId}:${request.params.websiteId}`;
  const limit = checkVerificationRateLimit(key);
  if (!limit.allowed) {
    response.setHeader("Retry-After", String(limit.retryAfterSeconds));
    response.status(429).json({ error: "VERIFICATION_RATE_LIMITED", retryAfterSeconds: limit.retryAfterSeconds });
    return;
  }

  try {
    const website = await findWebsite(request);
    if (!website) {
      response.status(404).json({ error: "WEBSITE_NOT_FOUND" });
      return;
    }
    if (request.body?.domain !== undefined) {
      let requestedDomain: string;
      try {
        requestedDomain = normalizeDomain(String(request.body.domain));
      } catch {
        response.status(400).json({ error: "INVALID_DOMAIN" });
        return;
      }
      if (requestedDomain !== website.domain) {
        response.status(400).json({ error: "DOMAIN_MISMATCH", expectedDomain: website.domain });
        return;
      }
    }

    const verification = getTrackingVerificationStatus(website);
    if (!verification.verified) {
      response.status(website.status === WebsiteStatus.ACTIVE ? 202 : 409).json({ ...verification, installationStatus: website.installationStatus });
      return;
    }

    response.json({ ...verification, installationStatus: website.installationStatus, firstEventAt: website.firstEventAt, lastEventAt: website.lastEventAt });
  } catch (error) {
    console.error("Tracking verification failed", error);
    response.status(500).json({ error: "TRACKING_VERIFICATION_FAILED" });
  }
});

websiteRouter.patch("/:websiteId", requireOrganizationRole("OWNER", "ADMIN", "DEVELOPER"), async (request, response) => {
  const input = validate(websiteUpdateSchema, request.body, response) as z.infer<typeof websiteUpdateSchema> | null;
  if (!input) return;
  let domain: string | undefined;
  if (input.domain !== undefined) {
    try {
      domain = normalizeDomain(input.domain);
    } catch {
      response.status(400).json({ error: "INVALID_DOMAIN" });
      return;
    }
  }

  try {
    const existing = await findWebsite(request);
    if (!existing) {
      response.status(404).json({ error: "WEBSITE_NOT_FOUND" });
      return;
    }
    const website = await prisma.website.update({
      where: { id: existing.id },
      data: { ...input, domain, currency: input.currency?.toUpperCase() },
      select: websiteSelect,
    });
    response.json({ website });
  } catch (error) {
    console.error("Website update failed", error);
    response.status(500).json({ error: "WEBSITE_UPDATE_FAILED" });
  }
});

websiteRouter.post("/:websiteId/pause", requireOrganizationRole("OWNER", "ADMIN", "DEVELOPER"), async (request, response) => {
  try {
    const existing = await findWebsite(request);
    if (!existing) {
      response.status(404).json({ error: "WEBSITE_NOT_FOUND" });
      return;
    }
    if (existing.status === WebsiteStatus.ARCHIVED) {
      response.status(409).json({ error: "ARCHIVED_WEBSITE_CANNOT_BE_PAUSED" });
      return;
    }
    const website = await prisma.website.update({ where: { id: existing.id }, data: { status: WebsiteStatus.PAUSED }, select: websiteSelect });
    response.json({ website });
  } catch (error) {
    console.error("Website pause failed", error);
    response.status(500).json({ error: "WEBSITE_PAUSE_FAILED" });
  }
});

websiteRouter.post("/:websiteId/archive", requireOrganizationRole("OWNER", "ADMIN"), async (request, response) => {
  try {
    const existing = await findWebsite(request);
    if (!existing) {
      response.status(404).json({ error: "WEBSITE_NOT_FOUND" });
      return;
    }
    const website = await prisma.website.update({ where: { id: existing.id }, data: { status: WebsiteStatus.ARCHIVED }, select: websiteSelect });
    response.json({ website });
  } catch (error) {
    console.error("Website archive failed", error);
    response.status(500).json({ error: "WEBSITE_ARCHIVE_FAILED" });
  }
});

websiteRouter.delete("/:websiteId", requireOrganizationRole("OWNER", "ADMIN"), async (request, response) => {
  try {
    const existing = await findWebsite(request);
    if (!existing) {
      response.status(404).json({ error: "WEBSITE_NOT_FOUND" });
      return;
    }
    if (existing.status !== WebsiteStatus.ARCHIVED) {
      response.status(409).json({ error: "WEBSITE_MUST_BE_ARCHIVED" });
      return;
    }
    await prisma.website.delete({ where: { id: existing.id } });
    response.status(204).send();
  } catch (error) {
    console.error("Website deletion failed", error);
    response.status(500).json({ error: "WEBSITE_DELETE_FAILED" });
  }
});

/** Called by the event collector when a valid first event is received. */
export async function recordTrackingEvent(websiteId: string) {
  const now = new Date();
  const existing = await prisma.website.findUnique({ where: { id: websiteId }, select: { firstEventAt: true } });
  if (!existing) throw new Error("WEBSITE_NOT_FOUND");
  return prisma.website.update({
    where: { id: websiteId },
    data: {
      installationStatus: "VERIFIED",
      trackingVerifiedAt: existing.firstEventAt ? undefined : now,
      firstEventAt: existing.firstEventAt ?? now,
      lastEventAt: now,
    },
    select: { id: true, installationStatus: true, trackingVerifiedAt: true, firstEventAt: true, lastEventAt: true },
  });
}
