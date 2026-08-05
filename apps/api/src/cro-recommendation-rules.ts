import { CRO_SAMPLE_THRESHOLDS, hasCROSample, normalizeCRORecommendation, type CRORecommendation } from "./cro-recommendations";

type OverviewSignals = { visitors: number; conversions: number; conversionRate: number };
type FormSignals = { form_id: string; path?: string; started: number; completed: number; errors: number; completionRate: number };
type FunnelStepSignals = { name: string; path: string; visitors: string; dropOff: string };
type FunnelSignals = { id: string; name: string; totalVisitors: string; conversions: string; steps: FunnelStepSignals[] };
type BehaviourIssue = { type: string; title: string; page: string; detail: string; impact: string; priority: string };
type BehaviourSignals = { issues: BehaviourIssue[]; scrollPages: Array<{ page: string; visitors: string; depth: number }> };
type PageSignals = { path: string; visitors: number; page_views: number; conversions: number };

export type CRORuleInput = {
  overview: OverviewSignals;
  forms: FormSignals[];
  funnels: FunnelSignals[];
  behaviour: BehaviourSignals;
  pages: PageSignals[];
};

function number(value: string | number | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function evidenceText(recommendation: CRORecommendation) {
  return recommendation.evidence.map((item) => `${item.metric}: ${item.value}${item.context ? ` (${item.context})` : ""}`);
}

function funnelRecommendations(funnels: FunnelSignals[]) {
  const recommendations: CRORecommendation[] = [];
  for (const funnel of funnels) {
    const totalVisitors = number(funnel.totalVisitors);
    if (!hasCROSample("funnelVisitors", totalVisitors)) continue;
    const bottleneck = funnel.steps.reduce<{ step: FunnelStepSignals; dropOff: number } | null>((best, step) => {
      const dropOff = number(step.dropOff.replace("%", ""));
      return dropOff > (best?.dropOff ?? 0) ? { step, dropOff } : best;
    }, null);
    if (!bottleneck || bottleneck.dropOff <= 0) continue;
    const stepVisitors = number(bottleneck.step.visitors);
    const recommendation = normalizeCRORecommendation({
      source: "funnel",
      rule: "step-dropoff",
      entity: `${funnel.id}:${bottleneck.step.path}`,
      category: "Funnels",
      priority: bottleneck.dropOff >= 50 ? "High" : "Medium",
      title: `${funnel.name} loses visitors at ${bottleneck.step.name}`,
      page: bottleneck.step.path,
      problem: `${bottleneck.dropOff.toFixed(1)}% of funnel visitors are lost before or at ${bottleneck.step.name}.`,
      reason: "The largest measured step drop-off identifies the first journey point where visitors stop progressing.",
      evidence: [
        { source: "funnel", metric: "Funnel visitors", value: totalVisitors, context: funnel.name },
        { source: "funnel", metric: "Step visitors", value: stepVisitors, context: bottleneck.step.name },
        { source: "funnel", metric: "Step drop-off", value: `${bottleneck.dropOff.toFixed(1)}%`, context: bottleneck.step.path },
      ],
      confidence: totalVisitors >= 20 ? "High" : "Directional",
      businessImpact: "Improving the bottleneck can recover visitors before they leave the measured conversion journey.",
      recommendation: `Review ${bottleneck.step.name} for unclear copy, friction, broken links, or missing event instrumentation before optimizing later steps.`,
      expectedImprovement: `+${Math.max(3, Math.round(bottleneck.dropOff * 0.15))}–${Math.max(6, Math.round(bottleneck.dropOff * 0.3))}% funnel completion relative`,
    });
    recommendations.push(recommendation);
  }
  return recommendations;
}

function formRecommendations(forms: FormSignals[]) {
  return forms.filter((form) => hasCROSample("formStarts", number(form.started)) && number(form.errors) > 0 && number(form.errors) / number(form.started) >= 0.2).map((form) => {
    const errorRate = (number(form.errors) / number(form.started)) * 100;
    const recommendation = normalizeCRORecommendation({
      source: "form",
      rule: "validation-friction",
      entity: form.form_id,
      category: "Forms",
      priority: errorRate >= 50 ? "High" : "Medium",
      title: `Form ${form.form_id} creates validation friction`,
      page: form.path || "/",
      problem: `${errorRate.toFixed(1)}% of form starts produced a validation error.`,
      reason: "Validation errors interrupt completion and can signal unclear requirements, restrictive formats, or an inaccessible field experience.",
      evidence: [
        { source: "form", metric: "Form starts", value: number(form.started), context: form.form_id },
        { source: "form", metric: "Validation errors", value: number(form.errors), context: form.form_id },
        { source: "form", metric: "Completion rate", value: `${number(form.completionRate).toFixed(1)}%`, context: form.form_id },
      ],
      confidence: number(form.started) >= 20 ? "High" : "Directional",
      businessImpact: "Reducing avoidable validation failures can recover high-intent form starts without increasing acquisition spend.",
      recommendation: "Review the affected fields for clear examples, permissive formats, inline feedback, and mobile-friendly error recovery.",
      expectedImprovement: errorRate >= 50 ? "+8–15% form completion relative" : "+4–9% form completion relative",
    });
    return recommendation;
  });
}

function behaviourRecommendations(behaviour: BehaviourSignals) {
  const recommendations: CRORecommendation[] = [];
  for (const issue of behaviour.issues) {
    const sourceRule = issue.type === "Rage click" ? "rage-click" : issue.type === "Dead click" ? "dead-click" : "scroll-depth";
    const category = issue.type === "Scroll drop-off" ? "Content" : "UX";
    const priority = issue.priority === "High" ? "High" : "Medium";
    const visitorMatch = issue.detail.match(/(?:across|over) ([0-9]+) visitors/);
    const visitors = number(visitorMatch?.[1]);
    if (sourceRule !== "scroll-depth" && !hasCROSample("behaviourVisitors", visitors)) continue;
    if (sourceRule === "scroll-depth") {
      const page = behaviour.scrollPages.find((row) => row.page === issue.page);
      if (!page || !hasCROSample("behaviourVisitors", number(page.visitors))) continue;
    }
    const recommendation = normalizeCRORecommendation({
      source: "behaviour",
      rule: sourceRule,
      entity: issue.page,
      category,
      priority,
      title: issue.title,
      page: issue.page,
      problem: issue.detail,
      reason: issue.type === "Rage click" ? "Repeated clicks in a short interval often indicate missing feedback, an unresponsive control, or a target that is difficult to use." : issue.type === "Dead click" ? "Clicks without link or role metadata may indicate a visual affordance that does not deliver the expected next step." : "Low scroll depth can indicate that important content or the next action is not visible early enough on the page.",
      evidence: [{ source: "behaviour", metric: issue.type, value: issue.detail, context: issue.page }],
      confidence: issue.type === "Rage click" ? "Medium" : "Directional",
      businessImpact: "Removing interaction confusion can improve journey progression and reduce wasted sessions.",
      recommendation: issue.type === "Scroll drop-off" ? "Move the primary value proposition and next action higher, then verify the page communicates a clear reason to continue scrolling." : "Inspect the target in a replay or browser session and improve its feedback, hit area, semantic role, or link destination.",
      expectedImprovement: issue.impact,
    });
    recommendations.push(recommendation);
  }
  return recommendations;
}

function pageRecommendations(pages: PageSignals[]) {
  return pages.filter((page) => hasCROSample("pageVisitors", number(page.visitors)) && hasCROSample("pageViews", number(page.page_views)) && number(page.conversions) === 0).slice(0, 5).map((page) => normalizeCRORecommendation({
    source: "page",
    rule: "no-conversion",
    entity: page.path,
    category: "Content",
    priority: "Medium",
    title: "A high-traffic page has no recorded conversion signal",
    page: page.path || "/",
    problem: `${page.visitors} visitors viewed ${page.path || "/"}, but no conversion event was recorded there.`,
    reason: "The page attracts attention but is not currently connected to a measurable conversion outcome.",
    evidence: [
      { source: "page", metric: "Unique visitors", value: number(page.visitors), context: page.path || "/" },
      { source: "page", metric: "Page views", value: number(page.page_views), context: page.path || "/" },
      { source: "page", metric: "Conversions", value: 0, context: page.path || "/" },
    ],
    confidence: "Medium",
    businessImpact: "Improving the next step on a high-traffic page can unlock conversions from existing demand.",
    recommendation: "Clarify the page goal, strengthen the primary CTA, and verify that the intended conversion event fires after completion.",
    expectedImprovement: "+3–8% relative",
  }));
}

export function buildCRORecommendations(input: CRORuleInput) {
  const recommendations = [
    ...funnelRecommendations(input.funnels),
    ...formRecommendations(input.forms),
    ...behaviourRecommendations(input.behaviour),
    ...pageRecommendations(input.pages),
  ];
  const seen = new Set<string>();
  return recommendations.filter((recommendation) => {
    if (seen.has(recommendation.fingerprint)) return false;
    seen.add(recommendation.fingerprint);
    return true;
  });
}

export { CRO_SAMPLE_THRESHOLDS, evidenceText };
