export const CRO_SIGNAL_SOURCES = ["overview", "page", "funnel", "form", "behaviour", "visitor"] as const;
export type CROSignalSource = typeof CRO_SIGNAL_SOURCES[number];

export const CRO_CATEGORIES = ["UX", "Forms", "Funnels", "Content", "CTA"] as const;
export type CROCategory = typeof CRO_CATEGORIES[number];

export const CRO_PRIORITIES = ["High", "Medium", "Low"] as const;
export type CROPriority = typeof CRO_PRIORITIES[number];

export const CRO_CONFIDENCE_LEVELS = ["High", "Medium", "Directional"] as const;
export type CROConfidence = typeof CRO_CONFIDENCE_LEVELS[number];

/** Minimum observations required before a rule may produce a recommendation. */
export const CRO_SAMPLE_THRESHOLDS = {
  overviewVisitors: 20,
  pageVisitors: 10,
  pageViews: 20,
  formStarts: 10,
  funnelVisitors: 10,
  behaviourVisitors: 10,
} as const;

export type CROEvidence = {
  source: CROSignalSource;
  metric: string;
  value: number | string;
  context?: string;
};

export type CROSignal = {
  source: CROSignalSource;
  entity: string;
  page?: string;
  metrics: Record<string, number>;
  evidence: CROEvidence[];
  sufficientSample: boolean;
};

export type CRORecommendation = {
  fingerprint: string;
  source: CROSignalSource;
  category: CROCategory;
  priority: CROPriority;
  title: string;
  page: string;
  problem: string;
  reason: string;
  evidence: CROEvidence[];
  confidence: CROConfidence;
  businessImpact: string;
  recommendation: string;
  expectedImprovement: string;
};

export type UnifiedCROSignals = {
  signals: CROSignal[];
};

function cleanText(value: string, maxLength = 240) {
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

export function normalizeCROPath(value: string | null | undefined) {
  const candidate = cleanText(value || "/", 512);
  try {
    const parsed = new URL(candidate, "https://analytics.invalid");
    const path = parsed.pathname || "/";
    return path.startsWith("/") ? path : `/${path}`;
  } catch {
    const path = candidate.split(/[?#]/, 1)[0] || "/";
    return path.startsWith("/") ? path : `/${path}`;
  }
}

function normalizeKey(value: string) {
  return cleanText(value, 160).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "site-wide";
}

/** Stable across refreshes and safe to use with the website/fingerprint unique key. */
export function createCROFingerprint(source: CROSignalSource, rule: string, entity: string) {
  const normalizedEntity = entity.startsWith("/") || /^https?:\/\//i.test(entity) ? normalizeCROPath(entity) : entity;
  return `cro:${normalizeKey(source)}:${normalizeKey(rule)}:${normalizeKey(normalizedEntity)}`;
}

export function normalizeCROEvidence(evidence: readonly CROEvidence[]) {
  const seen = new Set<string>();
  return evidence.filter((item) => {
    const normalized = {
      source: item.source,
      metric: cleanText(item.metric, 80),
      value: typeof item.value === "number" ? item.value : cleanText(item.value, 120),
      ...(item.context ? { context: cleanText(item.context, 160) } : {}),
    } satisfies CROEvidence;
    const key = JSON.stringify(normalized);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8).map((item) => ({
    source: item.source,
    metric: cleanText(item.metric, 80),
    value: typeof item.value === "number" ? item.value : cleanText(item.value, 120),
    ...(item.context ? { context: cleanText(item.context, 160) } : {}),
  }));
}

export function hasCROSample(kind: keyof typeof CRO_SAMPLE_THRESHOLDS, value: number) {
  return Number.isFinite(value) && value >= CRO_SAMPLE_THRESHOLDS[kind];
}

export function normalizeCRORecommendation(input: Omit<CRORecommendation, "fingerprint"> & { rule: string; entity: string }): CRORecommendation {
  return {
    fingerprint: createCROFingerprint(input.source, input.rule, input.entity),
    source: input.source,
    category: input.category,
    priority: input.priority,
    title: cleanText(input.title),
    page: normalizeCROPath(input.page),
    problem: cleanText(input.problem),
    reason: cleanText(input.reason),
    evidence: normalizeCROEvidence(input.evidence),
    confidence: input.confidence,
    businessImpact: cleanText(input.businessImpact),
    recommendation: cleanText(input.recommendation),
    expectedImprovement: cleanText(input.expectedImprovement, 120),
  };
}
