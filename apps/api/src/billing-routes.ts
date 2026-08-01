import { createHmac, timingSafeEqual } from "node:crypto";
import { BillingEventStatus, SubscriptionStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "./lib/prisma";

const billingWebhookSchema = z.object({
  eventId: z.string().trim().min(3).max(255),
  eventType: z.string().trim().min(2).max(100),
  organizationId: z.string().uuid().optional(),
  providerCustomerId: z.string().trim().max(255).optional(),
  providerSubscriptionId: z.string().trim().max(255).optional(),
  plan: z.string().trim().max(80).optional(),
  status: z.nativeEnum(SubscriptionStatus).optional(),
  currentPeriodStart: z.string().datetime().optional(),
  currentPeriodEnd: z.string().datetime().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
});

function webhookSecret() { return process.env.BILLING_WEBHOOK_SECRET; }

function hasValidSignature(payload: string, signature: string | undefined) {
  const secret = webhookSecret();
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const supplied = signature.replace(/^sha256=/, "");
  if (!/^[a-f0-9]+$/i.test(supplied) || supplied.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(supplied, "hex"), Buffer.from(expected, "hex"));
}

export const billingRouter = Router();

billingRouter.post("/webhooks/:provider", async (request, response) => {
  const provider = typeof request.params.provider === "string" ? request.params.provider.trim().toLowerCase() : "";
  if (!provider || !/^[a-z0-9_-]{2,40}$/.test(provider)) { response.status(400).json({ error: "INVALID_BILLING_PROVIDER" }); return; }
  const payload = JSON.stringify(request.body ?? {});
  if (!hasValidSignature(payload, request.header("x-billing-signature"))) { response.status(401).json({ error: "INVALID_BILLING_SIGNATURE" }); return; }
  const parsed = billingWebhookSchema.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ error: "INVALID_BILLING_EVENT", details: parsed.error.flatten() }); return; }
  const input = parsed.data;
  const payloadHash = createHmac("sha256", webhookSecret()!).update(payload).digest("hex");
  try {
    const existing = await prisma.billingEvent.findUnique({ where: { provider_providerEventId: { provider, providerEventId: input.eventId } } });
    if (existing) { response.json({ accepted: true, duplicate: true, eventId: input.eventId }); return; }
    const existingSubscription = input.providerSubscriptionId ? await prisma.subscription.findUnique({ where: { provider_providerSubscriptionId: { provider, providerSubscriptionId: input.providerSubscriptionId } } }) : null;
    const organizationId = input.organizationId ?? existingSubscription?.organizationId;
    const canUpdateSubscription = Boolean(organizationId && input.providerSubscriptionId && input.plan && input.status);
    await prisma.$transaction(async (tx) => {
      await tx.billingEvent.create({ data: { provider, providerEventId: input.eventId, eventType: input.eventType, payloadHash, status: BillingEventStatus.RECEIVED } });
      if (canUpdateSubscription) {
        await tx.subscription.upsert({
          where: { provider_providerSubscriptionId: { provider, providerSubscriptionId: input.providerSubscriptionId! } },
          update: { organizationId: organizationId!, providerCustomerId: input.providerCustomerId, plan: input.plan!, status: input.status!, currentPeriodStart: input.currentPeriodStart ? new Date(input.currentPeriodStart) : null, currentPeriodEnd: input.currentPeriodEnd ? new Date(input.currentPeriodEnd) : null, cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false, canceledAt: input.status === SubscriptionStatus.CANCELED ? new Date() : null },
          create: { organizationId: organizationId!, provider, providerCustomerId: input.providerCustomerId, providerSubscriptionId: input.providerSubscriptionId!, plan: input.plan!, status: input.status!, currentPeriodStart: input.currentPeriodStart ? new Date(input.currentPeriodStart) : null, currentPeriodEnd: input.currentPeriodEnd ? new Date(input.currentPeriodEnd) : null, cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false, canceledAt: input.status === SubscriptionStatus.CANCELED ? new Date() : null },
        });
      }
      await tx.billingEvent.update({ where: { provider_providerEventId: { provider, providerEventId: input.eventId } }, data: { status: BillingEventStatus.PROCESSED, processedAt: new Date() } });
    });
    response.status(202).json({ accepted: true, duplicate: false, eventId: input.eventId, subscriptionUpdated: canUpdateSubscription });
  } catch (error) {
    console.error("Billing webhook failed", error);
    response.status(500).json({ error: "BILLING_EVENT_FAILED" });
  }
});
