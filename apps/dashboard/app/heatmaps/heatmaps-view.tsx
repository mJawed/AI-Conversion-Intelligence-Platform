"use client";

import { useState } from "react";
import type { HeatmapPoint } from "../data/mock";

const modes = ["Clicks", "Scroll depth", "Dead clicks"] as const;

export function HeatmapsView({ points, live = false, rows = [], message }: Readonly<{ points: HeatmapPoint[]; live?: boolean; rows?: { url: string; clicks: number; visitors: number }[]; message?: string }>) {
  const [mode, setMode] = useState<(typeof modes)[number]>("Clicks");
  const [page, setPage] = useState(rows[0]?.url ?? "/pricing");
  const visiblePoints = mode === "Dead clicks" ? points.filter((point) => point.type === "dead") : points;
  const pageRows = rows.filter((row) => row.url === page);
  const selectedRow = pageRows[0] ?? rows[0];
  const liveUnavailable = live && mode !== "Clicks";

  return (
    <div className="heatmap-explorer">
      <div className="heatmap-toolbar">
        <div className="mode-tabs" role="tablist" aria-label="Heatmap mode">
          {modes.map((item) => <button className={item === mode ? "mode-tab active" : "mode-tab"} key={item} onClick={() => setMode(item)} type="button" role="tab" aria-selected={item === mode}>{item}</button>)}
        </div>
        <div className="filters"><select className="select-control" value={page} onChange={(event) => setPage(event.target.value)} aria-label="Select heatmap page">{live ? rows.map((row) => <option key={row.url}>{row.url}</option>) : <><option>/pricing</option><option>/</option><option>/features</option><option>/contact</option></>}</select><span className="date-pill">{live ? "Live data" : "Last 30 days"}</span></div>
      </div>
      <div className="heatmap-layout">
        <section className="heatmap-stage" aria-label={`${mode} heatmap for ${page}`}>
          <div className="stage-browser"><span /><span /><span /><b>{page}</b></div>
          <div className="stage-page">
            <div className="stage-nav"><strong>AI Growth</strong><span>Features</span><span>Pricing</span><span>Contact</span><button>Start free trial</button></div>
            <div className="stage-hero"><small>THE GROWTH PLATFORM</small><h2>Turn more visitors into customers.</h2><p>Understand what users do, why they leave, and what to fix next.</p><button>Start free trial →</button></div>
            <div className="stage-content"><div /><div /><div /><div /><div /><div /></div>
            {!live && visiblePoints.map((point, index) => <i className={`heat-point heat-${point.type}`} key={`${point.x}-${point.y}`} style={{ left: `${point.x}%`, top: `${point.y}%`, opacity: Math.max(.35, point.intensity / 100), transform: `translate(-50%, -50%) scale(${.7 + point.intensity / 100})` }} aria-label={`${point.type} event ${index + 1}`} />)}
            {liveUnavailable && <div className="stage-unavailable"><strong>{mode} data unavailable</strong><span>{message ?? "This event type is not available in the current tracking payload."}</span></div>}
          </div>
        </section>
        <aside className="heatmap-side">
          <div className="widget-heading"><div><p className="eyebrow">{mode}</p><h2>{page}</h2></div><span className="list-meta">{live ? `${selectedRow?.clicks ?? 0} clicks` : "12,842 views"}</span></div>
          <div className="heat-legend"><span>Low</span><i /><span>High</span></div>
          <div className="heat-stat"><span>Recorded clicks</span><strong>{live ? (selectedRow?.clicks ?? 0).toLocaleString() : "19.4%"}</strong><p>{live ? `${selectedRow?.visitors ?? 0} unique visitors` : "Primary CTA activity"}</p></div>
          <div className="heat-stat"><span>Coordinate coverage</span><strong>{live ? "Not available" : "Below 64% scroll"}</strong><p>{live ? "Click coordinates are not included in the current event payload." : "Only 36% reach the comparison table"}</p></div>
          <div className="heat-note"><span>✦</span><p>{live ? "Page-level click totals are available. Coordinate-level heatmaps require click coordinates in the tracking payload." : "Visitors focus on the hero CTA, but dead clicks appear around the pricing toggle."}</p></div>
          <button className="button button-dark" disabled={live} type="button">Generate AI summary →</button>
        </aside>
      </div>
    </div>
  );
}
