"use client";

import { useState } from "react";
import type { FunnelAnalytics } from "../data/mock";

export function FunnelsView({ funnels }: Readonly<{ funnels: FunnelAnalytics[] }>) {
  const [selectedId, setSelectedId] = useState(funnels[0]?.id ?? "");
  const selected = funnels.find((funnel) => funnel.id === selectedId) ?? funnels[0];
  if (!selected) return null;

  return <div className="funnels-explorer"><div className="funnel-tabs" role="tablist" aria-label="Funnels"><span className="tab-label">Tracked funnels</span>{funnels.map((funnel) => <button className={funnel.id === selected.id ? "form-tab active" : "form-tab"} key={funnel.id} onClick={() => setSelectedId(funnel.id)} type="button" role="tab" aria-selected={funnel.id === selected.id}>{funnel.name}</button>)}</div><section className="funnel-summary"><div><p className="eyebrow">{selected.description}</p><h2>{selected.name}</h2></div><div className="funnel-summary-metrics"><div><span>Visitors</span><strong>{selected.totalVisitors}</strong></div><div><span>Conversions</span><strong>{selected.conversions}</strong></div><div><span>Conversion rate</span><strong>{selected.conversionRate}</strong><b>{selected.change}</b></div></div></section><div className="funnel-content-grid"><FunnelSteps funnel={selected} /><FunnelExplanation explanation={selected.explanation} /></div><div className="funnel-bottom-grid"><SegmentComparison /><DropoffSummary funnel={selected} /></div></div>;
}

function FunnelSteps({ funnel }: Readonly<{ funnel: FunnelAnalytics }>) {
  return <section className="widget funnel-steps-widget" aria-labelledby="funnel-steps-heading"><div className="widget-heading"><div><p className="eyebrow">Journey analysis</p><h2 id="funnel-steps-heading">Conversion funnel</h2></div><button className="text-action" type="button">Edit funnel</button></div><div className="funnel-steps">{funnel.steps.map((step, index) => <div className="funnel-step" key={step.name}><div className="funnel-step-heading"><span className="step-number">{index + 1}</span><div><strong>{step.name}</strong><span>{step.path}</span></div><b>{step.visitors}</b></div><div className="step-track"><i style={{ width: `${step.count}%` }} /></div><div className="step-meta"><span>{step.conversion} of previous step</span>{step.dropOff !== "—" && <span className={step.dropOff.startsWith("6") ? "dropoff-high" : ""}>↓ {step.dropOff} drop-off</span>}</div>{step.issue && <span className="step-issue">⚑ {step.issue} is a bottleneck</span>}</div>)}</div></section>;
}

function FunnelExplanation({ explanation }: Readonly<{ explanation: FunnelAnalytics["explanation"] }>) {
  return <section className="funnel-explanation" aria-labelledby="funnel-explanation-heading"><div className="recommendation-top"><span className="priority priority-high">AI analysis</span><span className="recommendation-spark">✦</span></div><p className="eyebrow">Why visitors leave</p><h2 id="funnel-explanation-heading">{explanation.title}</h2><p className="recommendation-reason">{explanation.reason}</p><div className="confidence-row"><span>Confidence</span><strong>{explanation.confidence}</strong></div><div className="funnel-next-step"><span>Recommended action</span><p>{explanation.recommendation}</p></div><div className="recommendation-impact"><span>Expected improvement</span><strong>{explanation.impact}</strong></div><button className="button button-dark" type="button">Create action plan →</button></section>;
}

function SegmentComparison() {
  return <section className="widget segment-widget" aria-labelledby="segment-heading"><div className="widget-heading"><div><p className="eyebrow">Compare behaviour</p><h2 id="segment-heading">Segment performance</h2></div><span className="list-meta">Placeholder</span></div><div className="segment-row"><span className="segment-dot mobile" /><div><strong>Mobile</strong><span>7,824 visitors</span></div><b>2.94%</b><small>−1.87%</small></div><div className="segment-row"><span className="segment-dot desktop" /><div><strong>Desktop</strong><span>5,018 visitors</span></div><b>7.74%</b><small>Baseline</small></div><button className="outline-action" type="button">Add segment comparison +</button></section>;
}

function DropoffSummary({ funnel }: Readonly<{ funnel: FunnelAnalytics }>) {
  const bottlenecks = funnel.steps.filter((step) => step.issue);
  return <section className="widget" aria-labelledby="dropoff-heading"><div className="widget-heading"><div><p className="eyebrow">Prioritize fixes</p><h2 id="dropoff-heading">Largest drop-offs</h2></div><span className="list-meta">By step</span></div><div className="dropoff-list">{bottlenecks.map((step, index) => <div className="dropoff-row" key={step.name}><span>{index + 1}</span><div><strong>{step.name}</strong><p>{step.issue}</p></div><b>{step.dropOff}</b></div>)}</div></section>;
}
