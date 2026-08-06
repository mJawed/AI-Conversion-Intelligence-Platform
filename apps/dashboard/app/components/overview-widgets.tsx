import type { InsightPreview, TopPage, TrendPoint } from "../data/mock";
import type { LiveTracking, LiveVisitor, LiveVisitorActivity } from "../lib/api-client";

export function TrafficChart({ points }: Readonly<{ points: TrendPoint[] }>) {
  const max = Math.max(...points.map((point) => point.value), 1);
  const coordinates = points.map((point, index) => {
    const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
    const y = 100 - (point.value / max) * 80 - 10;
    return `${x},${y}`;
  }).join(" ");

  return (
    <section className="widget chart-widget" aria-labelledby="traffic-heading">
      <div className="widget-heading"><div><p className="eyebrow">Traffic</p><h2 id="traffic-heading">Visitor trend</h2></div><span className="legend"><i /> Visitors</span></div>
      <div className="chart-wrap">
        <div className="chart-y-axis"><span>100</span><span>50</span><span>0</span></div>
        <svg className="traffic-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Visitor trend rising over the last 30 days">
          <defs><linearGradient id="traffic-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#9be7b1" stopOpacity=".55" /><stop offset="100%" stopColor="#9be7b1" stopOpacity="0" /></linearGradient></defs>
          <line x1="0" x2="100" y1="25" y2="25" className="chart-grid" /><line x1="0" x2="100" y1="50" y2="50" className="chart-grid" /><line x1="0" x2="100" y1="75" y2="75" className="chart-grid" />
          <polygon points={`0,100 ${coordinates} 100,100`} className="chart-area" />
          {points.length > 0 && <polyline points={coordinates} className="chart-line" />}
        </svg>
      </div>
      <div className="chart-labels">{points.map((point) => <span key={point.label}>{point.label}</span>)}</div>
    </section>
  );
}

export function RealtimeCard({ available = true, live, loading = false, error, stale = false, onRetry }: Readonly<{ available?: boolean; live?: LiveTracking["live"] | null; loading?: boolean; error?: string | null; stale?: boolean; onRetry?: () => void }>) {
  const activeVisitors = live?.activeVisitors ?? 0;
  const width = Math.min(100, Math.max(0, activeVisitors * 2));
  const recentEvents = live?.recentEvents.slice(0, 4) ?? [];
  const updatedAt = live?.lastUpdatedAt ? new Date(live.lastUpdatedAt) : null;
  const updatedLabel = updatedAt && !Number.isNaN(updatedAt.getTime()) ? `Updated ${updatedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Waiting for data";
  return (
    <section className="widget realtime-widget" aria-labelledby="realtime-heading">
      <div className="widget-heading"><div><p className="eyebrow">Realtime</p><h2 id="realtime-heading">Active visitors</h2></div><span className={`live-label${live && !stale ? "" : " live-label-muted"}`}><i /> {live ? (stale ? "Stale" : "Live") : "Waiting"}</span></div>
      {loading && !live ? <div className="realtime-loading">Loading live activity…</div> : error && !live ? <div className="realtime-error"><span>{error}</span>{onRetry && <button className="text-link realtime-retry" onClick={onRetry} type="button">Retry</button>}</div> : <>
        <div className="realtime-number">{available ? (live ? activeVisitors : "37") : "—"} <span>visitors</span></div>
        <div className="realtime-bar"><span style={{ width: available ? (live ? `${width}%` : "67%") : "0%" }} /></div>
        <div className="realtime-meta"><span>{live ? (stale ? "Updates paused — retry to reconnect" : updatedLabel) : available ? "67% on mobile" : "Realtime endpoint pending"}</span><span>{live ? `${live.activityWindowSeconds / 60} min window` : available ? "Peak: 52" : ""}</span></div>
        {live && recentEvents.length > 0 ? <div className="current-pages">{recentEvents.map((event) => <div key={event.eventId}><span className="page-dot" /> <span className="realtime-event-type">{event.eventType.replaceAll("_", " ")}</span> {event.path} <strong>{new Date(event.occurredAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</strong></div>)}</div> : live ? <p className="widget-empty">No visitor activity in the last {live.activityWindowSeconds / 60} minutes.</p> : available && <div className="current-pages"><div><span className="page-dot" /> /pricing <strong>14</strong></div><div><span className="page-dot" /> / <strong>9</strong></div><div><span className="page-dot" /> /features <strong>7</strong></div></div>}
      </>}
    </section>
  );
}

function activityIcon(type: LiveVisitorActivity["type"]) {
  return { page_view: "⌂", navigation: "→", click: "↗", form_start: "▤", form_error: "!", form_submit: "✓", scroll: "↕", conversion: "✓", heartbeat: "•" }[type];
}

function timeLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function visitorActivityStatus(lastSeenAt: string) {
  const ageSeconds = Math.max(0, (Date.now() - new Date(lastSeenAt).getTime()) / 1000);
  return ageSeconds <= 60 ? "Active" : ageSeconds <= 300 ? "Recently active" : "Offline";
}

export function LiveVisitorExplorer({ visitors, selectedVisitorLabel, timeline, loading = false, timelineLoading = false, error, timelineError, updatedAt, stale = false, timelineUpdatedAt, onSelect, onRetry }: Readonly<{ visitors: LiveVisitor[]; selectedVisitorLabel: string | null; timeline: LiveVisitorActivity[]; loading?: boolean; timelineLoading?: boolean; error?: string | null; timelineError?: string | null; updatedAt?: string | null; stale?: boolean; timelineUpdatedAt?: string | null; onSelect: (label: string) => void; onRetry?: () => void }>) {
  const selected = visitors.find((visitor) => visitor.anonymousLabel === selectedVisitorLabel) ?? null;
  const updatedLabel = updatedAt ? `Updated ${timeLabel(updatedAt)}` : "Waiting for refresh";
  return <section className="live-explorer" aria-labelledby="live-explorer-heading"><div className="widget-heading"><div><p className="eyebrow">Realtime</p><h2 id="live-explorer-heading">Live visitor activity</h2></div><div className={`live-label${stale ? " live-label-muted" : ""}`}><i /> {stale ? "Stale" : visitors.length ? `${visitors.length} active` : "Waiting"}</div></div>{loading ? <div className="realtime-loading">Loading live visitors…</div> : error && !visitors.length ? <div className="realtime-error"><span>{error}</span>{onRetry && <button className="text-link realtime-retry" onClick={onRetry} type="button">Retry</button>}</div> : !visitors.length ? <div className="visitor-empty"><span>◌</span><strong>No visitors are active right now</strong><p>Active anonymous visitors will appear here during the five-minute live window.</p></div> : <><div className="live-explorer-meta"><span>{updatedLabel}{stale ? " · Updates paused" : " · Refreshes automatically"}</span>{error && <span className="realtime-error-inline">{error}</span>}</div><div className="visitor-layout"><div className="visitor-list-panel"><div className="list-heading"><div><p className="eyebrow">Active visitors</p><h3>{visitors.length} currently active</h3></div><span className="list-meta">Anonymous</span></div><div className="visitor-list">{visitors.map((visitor) => { const status = visitorActivityStatus(visitor.lastSeenAt); return <button className={`visitor-row${visitor.anonymousLabel === selectedVisitorLabel ? " selected" : ""}`} key={visitor.anonymousLabel} onClick={() => onSelect(visitor.anonymousLabel)} type="button"><span className="avatar">AN</span><span className="visitor-summary"><strong>{visitor.anonymousLabel}</strong><span>{visitor.currentPath ?? "Current page unavailable"} · {visitor.lastActivity.replaceAll("_", " ")}</span></span><span className={`status status-${status === "Active" ? "active" : status === "Recently active" ? "returned" : "bounced"}`}>{status}</span></button>; })}</div></div><div className="visitor-detail">{selected ? <><div className="detail-heading"><div className="detail-identity"><span className="avatar avatar-large">AN</span><div><p className="eyebrow">Anonymous visitor</p><h3>{selected.anonymousLabel}</h3><span className={`status status-${visitorActivityStatus(selected.lastSeenAt) === "Active" ? "active" : "returned"}`}>{visitorActivityStatus(selected.lastSeenAt)}</span></div></div><span className={`live-label${stale ? " live-label-muted" : ""}`}><i /> {stale ? "Stale" : "Live"}</span></div><div className="detail-stats"><div><span>Current page</span><strong>{selected.currentPath ?? "Not available"}</strong></div><div><span>Last activity</span><strong>{selected.lastActivity.replaceAll("_", " ")}</strong></div><div><span>Events</span><strong>{selected.eventCount}</strong></div></div><div className="signal-grid live-signal-grid"><div><span>Device</span><strong>{selected.device ?? "Not available"}</strong></div><div><span>Browser</span><strong>{selected.browser ?? "Not available"}</strong></div><div><span>Source</span><strong>{selected.source ?? "Not available"}</strong></div><div><span>Sessions</span><strong>{selected.sessionCount}</strong></div></div><div className="detail-section"><div className="detail-section-heading"><h3>Session timeline</h3><span className="list-meta">{timelineUpdatedAt ? `Updated ${timeLabel(timelineUpdatedAt)}` : "Last 5 minutes"}</span></div>{timelineLoading ? <div className="realtime-loading">Loading activity…</div> : timelineError ? <div className="realtime-error">{timelineError}</div> : timeline.length ? <div className="timeline">{timeline.map((event, index) => <div className="timeline-event" key={`${event.occurredAt}-${event.type}-${event.path ?? ""}-${index}`}><span className="timeline-icon">{activityIcon(event.type)}</span><div><strong>{event.label ?? event.type.replaceAll("_", " ")}</strong><p>{event.path ?? "Page unavailable"}</p></div><time>{timeLabel(event.occurredAt)}</time></div>)}</div> : <p className="widget-empty">No session activity is available yet.</p>}</div></> : <div className="visitor-empty"><span>◌</span><strong>Select a visitor</strong><p>Choose an active visitor to inspect their recent activity.</p></div>}</div></div></>}</section>;
}

export function TopPages({ pages }: Readonly<{ pages: TopPage[] }>) {
  return (
    <section className="widget" aria-labelledby="pages-heading">
      <div className="widget-heading"><div><p className="eyebrow">Content</p><h2 id="pages-heading">Top pages</h2></div><a className="text-link" href="/visitors">View all →</a></div>
      <div className="page-list">{pages.map((page) => <div className="page-row" key={page.path}><span className="page-path">{page.path}</span><span className="page-visitors">{page.visitors}<small>{page.share}</small></span></div>)}</div>
    </section>
  );
}

export function InsightPreview({ insights, empty = false }: Readonly<{ insights: InsightPreview[]; empty?: boolean }>) {
  return (
    <section className="widget" aria-labelledby="insights-heading">
      <div className="widget-heading"><div><p className="eyebrow">AI analysis</p><h2 id="insights-heading">Recent insights</h2></div><a className="text-link" href="/insights">View all →</a></div>
      {empty ? <p className="widget-empty">AI insights will appear after analytics signals are available.</p> : <div className="insight-list">{insights.map((insight) => <div className="insight-row" key={insight.title}><span className={`priority priority-${insight.priority.toLowerCase()}`}>{insight.priority}</span><div><strong>{insight.title}</strong><span>{insight.category} · Est. impact {insight.impact}</span></div><span className="insight-arrow">→</span></div>)}</div>}
    </section>
  );
}
