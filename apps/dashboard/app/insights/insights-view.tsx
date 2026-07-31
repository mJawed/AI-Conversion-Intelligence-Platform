"use client";

import { useMemo, useState } from "react";
import type { AIInsight } from "../data/mock";

const categories = ["All categories", "Forms", "UX", "CTA", "Content", "Funnels"];
const severities = ["All priorities", "High", "Medium", "Low"];

export function InsightsView({ insights }: Readonly<{ insights: AIInsight[] }>) {
  const [category, setCategory] = useState(categories[0]);
  const [severity, setSeverity] = useState(severities[0]);
  const [selectedId, setSelectedId] = useState(insights[0]?.id ?? "");
  const filtered = useMemo(() => insights.filter((insight) => (category === categories[0] || insight.category === category) && (severity === severities[0] || insight.severity === severity)), [category, severity, insights]);
  const selected = insights.find((insight) => insight.id === selectedId) ?? filtered[0] ?? insights[0];
  if (!selected) return null;
  return <div className="insights-explorer"><div className="insights-toolbar"><div className="filters"><select className="select-control" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter insights by category">{categories.map((item) => <option key={item}>{item}</option>)}</select><select className="select-control" value={severity} onChange={(event) => setSeverity(event.target.value)} aria-label="Filter insights by priority">{severities.map((item) => <option key={item}>{item}</option>)}</select></div><span className="insights-count">{filtered.length} insights · Updated moments ago</span></div><div className="insights-layout"><section className="insight-list-panel"><div className="list-heading"><div><p className="eyebrow">Prioritized findings</p><h2>{filtered.length} opportunities</h2></div><span className="list-meta">AI ranked</span></div><div className="insight-list">{filtered.map((insight) => <button className={insight.id === selected.id ? "insight-card selected" : "insight-card"} key={insight.id} onClick={() => setSelectedId(insight.id)} type="button"><div className="insight-card-top"><span className={`priority priority-${insight.severity.toLowerCase()}`}>{insight.severity}</span><span className={`insight-status insight-status-${insight.status.toLowerCase()}`}>{insight.status}</span></div><strong>{insight.title}</strong><span>{insight.category} · {insight.page}</span><small>{insight.created}</small></button>)}{filtered.length === 0 && <div className="visitor-empty"><span>✦</span><strong>No insights match these filters</strong><p>Try a different category or priority.</p></div>}</div></section><InsightDetail insight={selected} />
  </div></div>;
}

function InsightDetail({ insight }: Readonly<{ insight: AIInsight }>) {
  return <section className="insight-detail" aria-label="Selected AI insight"><div className="insight-detail-header"><div><div className="insight-card-top"><span className={`priority priority-${insight.severity.toLowerCase()}`}>{insight.severity} priority</span><span className={`insight-status insight-status-${insight.status.toLowerCase()}`}>{insight.status}</span></div><p className="eyebrow">{insight.category} · {insight.page}</p><h2>{insight.title}</h2><span className="insight-created">Generated {insight.created}</span></div><span className="insight-spark">✦</span></div><InsightBlock label="Problem" text={insight.problem} /><InsightBlock label="Reason" text={insight.reason} /><div className="evidence-block"><div className="detail-section-heading"><h3>Evidence</h3><span className="confidence-badge">{insight.confidence} confidence</span></div><div className="evidence-list">{insight.evidence.map((item) => <span key={item}>✓ {item}</span>)}</div></div><InsightBlock label="Business impact" text={insight.businessImpact} /><div className="recommendation-block"><p className="eyebrow">Recommended action</p><p>{insight.recommendation}</p><div className="recommendation-impact"><span>Expected conversion improvement</span><strong>{insight.expectedImprovement}</strong></div></div><div className="insight-actions"><button className="button button-dark" type="button">Mark resolved ✓</button><button className="button" type="button">Dismiss insight</button></div></section>;
}

function InsightBlock({ label, text }: Readonly<{ label: string; text: string }>) {
  return <div className="insight-block"><h3>{label}</h3><p>{text}</p></div>;
}
