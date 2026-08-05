"use client";

import { useEffect, useMemo, useState } from "react";
import type { AIInsight } from "../data/mock";
import { useAccount, useMockData } from "../lib/account-context";
import type { InsightAlert } from "./page";

const categories = ["All categories", "Forms", "UX", "CTA", "Content", "Funnels"];
const severities = ["All priorities", "High", "Medium", "Low"];
const statuses = ["All statuses", "Open", "Resolved", "Dismissed"];
const sources = ["All sources", "Overview", "Page", "Funnel", "Form", "Behaviour", "Visitor"];
function sourceLabel(insight: AIInsight) { const source = insight.source ?? insight.category; return source.charAt(0).toUpperCase() + source.slice(1); }

export function InsightsView({ insights, alerts = [], unavailableSources = [], live = false, onStatusLive }: Readonly<{ insights: AIInsight[]; alerts?: InsightAlert[]; unavailableSources?: string[]; live?: boolean; onStatusLive?: (insightId: string, status: AIInsight["status"]) => Promise<void> }>) {
  const account = useAccount();
  const [category, setCategory] = useState(categories[0]);
  const [severity, setSeverity] = useState(severities[0]);
  const [status, setStatus] = useState(statuses[0]);
  const [source, setSource] = useState(sources[0]);
  const [sort, setSort] = useState("Priority");
  const [selectedId, setSelectedId] = useState(insights[0]?.id ?? "");
  const [items, setItems] = useState(insights);
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => { setItems(insights); setSelectedId(insights[0]?.id ?? ""); }, [insights]);
  const canReview = useMockData || ["OWNER", "ADMIN", "MARKETING"].includes(account.selectedOrganization?.role ?? "");
  const filtered = useMemo(() => [...items.filter((insight) => (category === categories[0] || insight.category === category) && (severity === severities[0] || insight.severity === severity) && (status === statuses[0] || insight.status === status) && (source === sources[0] || sourceLabel(insight) === source))].sort((a, b) => sort === "Recent" ? b.created.localeCompare(a.created) : ({ High: 0, Medium: 1, Low: 2 }[a.severity] - { High: 0, Medium: 1, Low: 2 }[b.severity])), [category, severity, sort, source, status, items]);
  const selected = items.find((insight) => insight.id === selectedId) ?? filtered[0] ?? items[0];
  if (!selected) return null;

  async function updateStatus(nextStatus: AIInsight["status"]) {
    if (live && onStatusLive) { try { await onStatusLive(selected.id, nextStatus); setItems((current) => current.map((insight) => insight.id === selected.id ? { ...insight, status: nextStatus } : insight)); setNotice(`Insight marked ${nextStatus.toLowerCase()}.`); } catch (error) { setNotice(error instanceof Error ? error.message : "Could not update insight status."); } return; }
    if (!canReview) { setNotice("Your role cannot update insight status."); return; }
    setItems((current) => current.map((insight) => insight.id === selected.id ? { ...insight, status: nextStatus } : insight));
    setNotice(`Insight marked ${nextStatus.toLowerCase()} in demo mode.`);
  }

  return <div className="insights-explorer">{notice && <p className="form-error insight-notice" role="status">{notice}</p>}{alerts.length > 0 && <section className="insight-alerts" aria-label="High priority alerts"><div><p className="eyebrow">Alert queue</p><h2>{alerts.length} high-priority {alerts.length === 1 ? "opportunity needs" : "opportunities need"} review</h2></div><div className="insight-alert-list">{alerts.map((alert) => <button className="insight-alert" key={alert.id} type="button" onClick={() => setSelectedId(alert.id)}><span className="priority priority-high">High</span><span><strong>{alert.title}</strong><small>{sourceLabel({ source: alert.source, category: alert.category } as AIInsight)} · {alert.page}</small></span><span className="insight-arrow">→</span></button>)}</div></section>}{unavailableSources.length > 0 && <div className="insight-source-warning" role="status"><strong>Some signals are temporarily unavailable.</strong><span>{unavailableSources.map((item) => item.charAt(0).toUpperCase() + item.slice(1)).join(", ")} could not refresh. Existing recommendations remain available.</span></div>}<div className="insights-toolbar"><div className="filters"><select className="select-control" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter insights by category">{categories.map((item) => <option key={item}>{item}</option>)}</select><select className="select-control" value={source} onChange={(event) => setSource(event.target.value)} aria-label="Filter insights by source">{sources.map((item) => <option key={item}>{item}</option>)}</select><select className="select-control" value={severity} onChange={(event) => setSeverity(event.target.value)} aria-label="Filter insights by priority">{severities.map((item) => <option key={item}>{item}</option>)}</select><select className="select-control" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter insights by status">{statuses.map((item) => <option key={item}>{item}</option>)}</select><select className="select-control" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort insights"><option>Priority</option><option>Recent</option></select></div><span className="insights-count">{filtered.length} insights · {live ? "Live data" : "Demo data"}</span></div><div className="insights-layout"><section className="insight-list-panel"><div className="list-heading"><div><p className="eyebrow">Prioritized findings</p><h2>{filtered.length} opportunities</h2></div><span className="list-meta">Evidence ranked</span></div><div className="insight-list">{filtered.map((insight) => <button className={insight.id === selected.id ? "insight-card selected" : "insight-card"} key={insight.id} onClick={() => setSelectedId(insight.id)} type="button"><div className="insight-card-top"><span className={`priority priority-${insight.severity.toLowerCase()}`}>{insight.severity}</span><span className={`insight-status insight-status-${insight.status.toLowerCase()}`}>{insight.status}</span></div><strong>{insight.title}</strong><span>{sourceLabel(insight)} · {insight.category} · {insight.page}</span><small>{insight.created}</small></button>)}{filtered.length === 0 && <div className="visitor-empty"><span>✦</span><strong>No insights match these filters</strong><p>Try a different source, category, priority, or status.</p></div>}</div></section><InsightDetail insight={selected} onStatus={updateStatus} canReview={canReview} /></div></div>;
}

function InsightDetail({ insight, onStatus, canReview }: Readonly<{ insight: AIInsight; onStatus: (status: AIInsight["status"]) => void; canReview: boolean }>) {
  return <section className="insight-detail" aria-label="Selected AI insight"><div className="insight-detail-header"><div><div className="insight-card-top"><span className={`priority priority-${insight.severity.toLowerCase()}`}>{insight.severity} priority</span><span className={`insight-status insight-status-${insight.status.toLowerCase()}`}>{insight.status}</span></div><p className="eyebrow">{sourceLabel(insight)} source · {insight.category} · {insight.page}</p><h2>{insight.title}</h2><span className="insight-created">Generated {insight.created}</span></div><span className="insight-spark">✦</span></div><InsightBlock label="Problem" text={insight.problem} /><InsightBlock label="Reason" text={insight.reason} /><div className="evidence-block"><div className="detail-section-heading"><h3>Evidence</h3><span className="confidence-badge">{insight.confidence} confidence</span></div>{insight.evidence.length ? <div className="evidence-list">{insight.evidence.map((item) => <span key={item}>✓ {item}</span>)}</div> : <p className="widget-empty">Evidence will appear when analytics signals are linked.</p>}</div><InsightBlock label="Business impact" text={insight.businessImpact} /><div className="recommendation-block"><p className="eyebrow">Recommended action</p><p>{insight.recommendation}</p><div className="recommendation-impact"><span>Expected conversion improvement</span><strong>{insight.expectedImprovement}</strong></div></div><div className="insight-actions"><button className="button button-dark" disabled={!canReview || insight.status === "Resolved"} onClick={() => onStatus("Resolved")} type="button">Mark resolved ✓</button><button className="button" disabled={!canReview || insight.status === "Dismissed"} onClick={() => onStatus("Dismissed")} type="button">Dismiss insight</button></div></section>;
}

function InsightBlock({ label, text }: Readonly<{ label: string; text: string }>) { return <div className="insight-block"><h3>{label}</h3><p>{text}</p></div>; }
