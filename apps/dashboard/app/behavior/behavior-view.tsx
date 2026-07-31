"use client";

import { useState } from "react";
import type { BehaviourIssue, ClickTarget } from "../data/mock";

const pageOptions = ["All pages", "/", "/pricing", "/features", "/blog/ai-growth"];

export function BehaviourView({ clickTargets, issues, scrollPages }: Readonly<{ clickTargets: ClickTarget[]; issues: BehaviourIssue[]; scrollPages: { page: string; visitors: string; depth: number; fold: number }[] }>) {
  const [page, setPage] = useState(pageOptions[0]);
  const visibleIssues = page === "All pages" ? issues : issues.filter((issue) => issue.page === page);
  return <div className="behaviour-explorer"><div className="behaviour-toolbar"><div><p className="eyebrow">Interaction analytics</p><h2>What are visitors doing?</h2></div><div className="filters"><select className="select-control" value={page} onChange={(event) => setPage(event.target.value)} aria-label="Filter behaviour by page">{pageOptions.map((option) => <option key={option}>{option}</option>)}</select><button className="date-pill" type="button">Last 30 days ▾</button></div></div><section className="behaviour-metrics"><Metric label="Total clicks" value="24,892" change="+14.8%" /><Metric label="Avg. scroll depth" value="61.4%" change="+3.2%" /><Metric label="Rage clicks" value="486" change="−8.1%" tone="good" /><Metric label="Dead clicks" value="1,208" change="+4.6%" tone="bad" /></section><div className="behaviour-grid"><ClickTargets targets={clickTargets} /><ScrollDepth pages={scrollPages} /></div><div className="behaviour-grid bottom-behaviour-grid"><BehaviourIssues issues={visibleIssues} /><PageJourney /></div></div>;
}

function Metric({ label, value, change, tone }: Readonly<{ label: string; value: string; change: string; tone?: "good" | "bad" }>) {
  return <article className="behaviour-metric"><span>{label}</span><strong>{value}</strong><b className={tone === "bad" ? "change-bad" : "change-good"}>{change}</b><small>vs. previous period</small></article>;
}

function ClickTargets({ targets }: Readonly<{ targets: ClickTarget[] }>) {
  return <section className="widget" aria-labelledby="click-targets-heading"><div className="widget-heading"><div><p className="eyebrow">Click analytics</p><h2 id="click-targets-heading">Top clicked elements</h2></div><button className="text-action" type="button">View heatmap →</button></div><div className="click-targets">{targets.map((target, index) => <div className="click-target" key={target.selector}><span className="rank-number">0{index + 1}</span><div><strong>{target.label}</strong><span>{target.selector}</span></div><b>{target.clicks}</b><small>{target.rate}</small>{target.issue && <em>{target.issue}</em>}</div>)}</div></section>;
}

function ScrollDepth({ pages }: Readonly<{ pages: { page: string; visitors: string; depth: number; fold: number }[] }>) {
  return <section className="widget" aria-labelledby="scroll-depth-heading"><div className="widget-heading"><div><p className="eyebrow">Attention signal</p><h2 id="scroll-depth-heading">Scroll depth by page</h2></div><span className="list-meta">Avg. visitor depth</span></div><div className="scroll-list">{pages.map((page) => <div className="scroll-row" key={page.page}><div className="scroll-label"><strong>{page.page}</strong><span>{page.visitors} visitors</span></div><div className="scroll-track"><i style={{ width: `${page.depth}%` }} /><span>{page.depth}%</span></div><small>Fold {page.fold}%</small></div>)}</div></section>;
}

function BehaviourIssues({ issues }: Readonly<{ issues: BehaviourIssue[] }>) {
  return <section className="widget" aria-labelledby="behaviour-issues-heading"><div className="widget-heading"><div><p className="eyebrow">UX signals</p><h2 id="behaviour-issues-heading">Issues to investigate</h2></div><span className="list-meta">{issues.length} findings</span></div><div className="behaviour-issue-list">{issues.map((issue) => <div className="behaviour-issue" key={issue.title}><span className={`issue-icon issue-${issue.type.toLowerCase().replace(" ", "-")}`}>{issue.type === "Rage click" ? "!" : issue.type === "Dead click" ? "×" : "↕"}</span><div><div className="issue-title"><strong>{issue.title}</strong><span className={`priority priority-${issue.priority.toLowerCase()}`}>{issue.priority}</span></div><p>{issue.page} · {issue.detail}</p><small>Est. impact {issue.impact}</small></div></div>)}</div></section>;
}

function PageJourney() {
  return <section className="widget journey-widget" aria-labelledby="journey-heading"><div className="widget-heading"><div><p className="eyebrow">Journey context</p><h2 id="journey-heading">Landing and exit pages</h2></div><span className="list-meta">Last 30 days</span></div><div className="journey-columns"><div><span className="journey-label">Top landing page</span><strong>/pricing</strong><p>6,218 visitors · 48.2% bounce</p><button className="text-action" type="button">Inspect page →</button></div><div><span className="journey-label">Top exit page</span><strong>/checkout</strong><p>1,104 exits · 65.9% drop-off</p><button className="text-action" type="button">Inspect page →</button></div></div><div className="journey-note"><span>✦</span><p>Pricing attracts high-intent visitors, but checkout exits are unusually high for this journey.</p></div></section>;
}
