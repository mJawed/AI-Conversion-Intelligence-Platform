import { createHash } from "node:crypto";
import { z } from "zod";

export const LIVE_ACTIVITY_TYPES = ["page_view", "navigation", "click", "form_start", "form_error", "form_submit", "scroll", "conversion", "heartbeat"] as const;
export type LiveActivityType = (typeof LIVE_ACTIVITY_TYPES)[number];

export const liveActivityTypeSchema = z.enum(LIVE_ACTIVITY_TYPES);

export const liveVisitorActivitySchema = z.object({
  type: liveActivityTypeSchema,
  occurredAt: z.string().datetime(),
  path: z.string().max(512).nullable(),
  label: z.string().max(160).nullable(),
});

export const anonymousVisitorLabelSchema = z.string().regex(/^Visitor #[A-F0-9]{6}$/);

export type LiveVisitorActivity = z.infer<typeof liveVisitorActivitySchema>;

export const liveVisitorSummarySchema = z.object({
  anonymousLabel: z.string().regex(/^Visitor #[A-F0-9]{6}$/),
  currentPath: z.string().max(512).nullable(),
  lastActivity: liveActivityTypeSchema,
  lastSeenAt: z.string().datetime(),
  sessionCount: z.number().int().nonnegative(),
  eventCount: z.number().int().nonnegative(),
  device: z.string().max(80).nullable(),
  browser: z.string().max(80).nullable(),
  source: z.string().max(160).nullable(),
});

export type LiveVisitorSummary = z.infer<typeof liveVisitorSummarySchema>;

const sensitiveKeyPattern = /(email|password|token|secret|authorization|cookie|phone|address|name|value)/i;
const safeMetadataKeys = new Set(["cta", "formId", "formName", "target", "scrollDepth", "conversionName", "eventName"]);

export function normalizeLivePath(value: string | null | undefined) {
  if (!value) return null;
  try {
    const parsed = /^https?:\/\//i.test(value) ? new URL(value).pathname : value.split(/[?#]/, 1)[0];
    const path = parsed.trim() || "/";
    return `${path.startsWith("/") ? "" : "/"}${path}`.slice(0, 512);
  } catch {
    return null;
  }
}

export function toAnonymousVisitorLabel(visitorId: string) {
  const digest = createHash("sha256").update(visitorId).digest("hex").slice(0, 6).toUpperCase();
  return `Visitor #${digest}`;
}

export function sanitizeLiveMetadata(input: Record<string, unknown> | null | undefined) {
  if (!input) return {};
  return Object.fromEntries(Object.entries(input).filter(([key, value]) => safeMetadataKeys.has(key) && !sensitiveKeyPattern.test(key) && ["string", "number", "boolean"].includes(typeof value)).map(([key, value]) => [key, typeof value === "string" ? value.trim().slice(0, 160) : value]));
}

export function liveActivityLabel(type: LiveActivityType, metadata: Record<string, unknown> | null | undefined) {
  const safe = sanitizeLiveMetadata(metadata);
  const cta = typeof safe.cta === "string" ? safe.cta : typeof safe.target === "string" ? safe.target : "";
  const formId = typeof safe.formId === "string" ? safe.formId : "";
  const depth = typeof safe.scrollDepth === "number" || typeof safe.scrollDepth === "string" ? `${safe.scrollDepth}%` : "";
  const labels: Record<LiveActivityType, string> = {
    page_view: "Viewed page",
    navigation: "Navigated to page",
    click: cta ? `Clicked ${cta}` : "Clicked an element",
    form_start: formId ? `Started ${formId} form` : "Started a form",
    form_error: formId ? `Form error in ${formId}` : "Form validation error",
    form_submit: formId ? `Submitted ${formId} form` : "Submitted a form",
    scroll: depth ? `Scrolled to ${depth}` : "Scrolled page",
    conversion: "Recorded conversion",
    heartbeat: "Active on page",
  };
  return labels[type];
}

export function toLiveActivityType(eventType: string, eventName?: string | null): LiveActivityType | null {
  if (eventType === "custom" && eventName === "live_heartbeat") return "heartbeat";
  if (eventType === "custom" && eventName && LIVE_ACTIVITY_TYPES.includes(eventName as LiveActivityType)) return eventName as LiveActivityType;
  if (eventType === "page_view") return "page_view";
  if (eventType === "navigation") return "navigation";
  if (eventType === "click") return "click";
  if (eventType === "form_start") return "form_start";
  if (eventType === "form_error") return "form_error";
  if (eventType === "form_submit") return "form_submit";
  if (eventType === "scroll") return "scroll";
  if (eventType === "conversion") return "conversion";
  return null;
}
