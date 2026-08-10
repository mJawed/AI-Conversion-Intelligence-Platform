import type { CRORecommendation, CROSignalSource } from "./cro-recommendations";

export type AIRecommendationEvidence = {
  fingerprint: string;
  source: CROSignalSource;
  page: string;
  problem: string;
  confidence: CRORecommendation["confidence"];
  priority: CRORecommendation["priority"];
  sampleSize: number | null;
  evidence: CRORecommendation["evidence"];
  limitations: string[];
  readyForAI: boolean;
};

function numericEvidence(recommendation: CRORecommendation, metricNames: string[]) {
  const item = recommendation.evidence.find((entry) => metricNames.some((name) => entry.metric.toLowerCase().includes(name)) && typeof entry.value === "number");
  return item && typeof item.value === "number" ? item.value : null;
}

function sampleSizeFor(recommendation: CRORecommendation) {
  if (recommendation.source === "form") return numericEvidence(recommendation, ["form starts"]);
  if (recommendation.source === "funnel") return numericEvidence(recommendation, ["funnel visitors"]);
  if (recommendation.source === "page") return numericEvidence(recommendation, ["unique visitors"]);
  if (recommendation.source === "behaviour") {
    const visitorEvidence = recommendation.evidence.find((entry) => /visitors/i.test(String(entry.value)));
    const match = typeof visitorEvidence?.value === "string" ? visitorEvidence.value.match(/(?:across|over)\s+(\d+)\s+visitors/i) : null;
    return match ? Number(match[1]) : null;
  }
  return null;
}

export function buildAIRecommendationEvidence(recommendations: CRORecommendation[]) {
  return recommendations.map<AIRecommendationEvidence>((recommendation) => {
    const sampleSize = sampleSizeFor(recommendation);
    const limitations: string[] = [];
    if (recommendation.confidence === "Directional") limitations.push("Sample size supports directional action, not a confident performance claim.");
    if (sampleSize === null) limitations.push("The source did not expose a directly attributable sample-size metric.");
    if (recommendation.source === "page" && recommendation.evidence.some((entry) => entry.metric === "Conversions" && entry.value === 0)) limitations.push("No conversion event was recorded on this page; verify conversion instrumentation before changing the page.");
    return {
      fingerprint: recommendation.fingerprint,
      source: recommendation.source,
      page: recommendation.page,
      problem: recommendation.problem,
      confidence: recommendation.confidence,
      priority: recommendation.priority,
      sampleSize,
      evidence: recommendation.evidence,
      limitations,
      readyForAI: recommendation.evidence.length > 0 && recommendation.confidence !== "Directional" || recommendation.evidence.length >= 2,
    };
  });
}
