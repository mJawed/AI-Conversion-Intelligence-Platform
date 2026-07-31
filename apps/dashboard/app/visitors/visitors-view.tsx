"use client";

import { useMemo, useState } from "react";
import type { Visitor } from "../data/mock";

const statusOptions = ["All visitors", "Active", "Converted", "Returned", "Bounced"] as const;

export function VisitorsView({ visitors, live = false }: Readonly<{ visitors: Visitor[]; live?: boolean }>) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("All visitors");
  const [sort, setSort] = useState("Recent");
  const [selectedId, setSelectedId] = useState(visitors[0]?.id ?? "");

  const filteredVisitors = useMemo(() => {
    const matches = visitors.filter((visitor) => {
      const matchesQuery = [visitor.name, visitor.currentPage, visitor.country, visitor.source].some((value) => value.toLowerCase().includes(query.toLowerCase()));
      return matchesQuery && (status === "All visitors" || visitor.status === status);
    });
    return [...matches].sort((a, b) => sort === "Engagement" ? b.events - a.events : sort === "Duration" ? b.duration.localeCompare(a.duration) : a.lastSeen.localeCompare(b.lastSeen));
  }, [query, sort, status, visitors]);

  const selected = visitors.find((visitor) => visitor.id === selectedId) ?? filteredVisitors[0] ?? visitors[0];

  return (
    <div className="visitor-explorer">
      <div className="visitor-toolbar">
        <label className="search-box"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search visitors, pages, sources" aria-label="Search visitors" /></label>
        <select className="select-control" value={status} onChange={(event) => setStatus(event.target.value as (typeof statusOptions)[number])} aria-label="Filter visitors by status">{statusOptions.map((option) => <option key={option}>{option}</option>)}</select>
        <select className="select-control" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort visitors"><option>Recent</option><option>Engagement</option><option>Duration</option></select>
      </div>

      <div className="visitor-layout">
        <section className="visitor-list-panel" aria-label="Visitor list">
          <div className="list-heading"><div><p className="eyebrow">Visitors</p><h2>{filteredVisitors.length} visitors found</h2></div><span className="list-meta">{live ? "Live analytics" : "Last 30 days"}</span></div>
          <div className="visitor-list">
            {filteredVisitors.map((visitor) => <button className={visitor.id === selected?.id ? "visitor-row selected" : "visitor-row"} key={visitor.id} onClick={() => setSelectedId(visitor.id)} type="button"><span className="avatar">{visitor.initials}</span><span className="visitor-summary"><strong>{visitor.name}</strong><span>{visitor.currentPage} · {visitor.lastSeen}</span></span><span className={`status status-${visitor.status.toLowerCase()}`}>{visitor.status}</span></button>)}
            {filteredVisitors.length === 0 && <div className="visitor-empty"><span>⌕</span><strong>No visitors match these filters</strong><p>Try a different search or status.</p></div>}
          </div>
        </section>

        {selected && <VisitorDetail visitor={selected} />}
      </div>
    </div>
  );
}

function VisitorDetail({ visitor }: Readonly<{ visitor: Visitor }>) {
  return (
    <section className="visitor-detail" aria-label="Selected visitor details">
      <div className="detail-heading"><div className="detail-identity"><span className="avatar avatar-large">{visitor.initials}</span><div><p className="eyebrow">Visitor {visitor.id}</p><h2>{visitor.name}</h2><span className={`status status-${visitor.status.toLowerCase()}`}>{visitor.status}</span></div></div><button className="icon-button" type="button" aria-label="More visitor actions">•••</button></div>
      <div className="detail-stats"><div><span>Current page</span><strong>{visitor.currentPage}</strong></div><div><span>Last seen</span><strong>{visitor.lastSeen}</strong></div><div><span>Sessions</span><strong>{visitor.sessions}</strong></div></div>
      <div className="detail-section"><div className="detail-section-heading"><h3>Visitor signals</h3><span className="signal-score">{visitor.status === "Converted" ? "Converted" : "Observed"}</span></div><div className="signal-grid"><div><span>Device</span><strong>{visitor.device}</strong></div><div><span>Country</span><strong>{visitor.country}</strong></div><div><span>Browser</span><strong>{visitor.browser}</strong></div><div><span>Source</span><strong>{visitor.source}</strong></div></div><div className="depth-row"><span>Scroll depth</span><strong>{visitor.scrollDepth ? `${visitor.scrollDepth}%` : "Not available"}</strong>{visitor.scrollDepth > 0 && <div className="depth-bar"><i style={{ width: `${visitor.scrollDepth}%` }} /></div>}</div></div>
      <div className="detail-section"><div className="detail-section-heading"><h3>Session timeline</h3><span className="list-meta">{visitor.duration} duration</span></div>{visitor.timeline.length ? <div className="timeline">{visitor.timeline.map((event) => <div className="timeline-event" key={`${event.time}-${event.title}`}><span className="timeline-icon">{event.icon}</span><div><strong>{event.title}</strong><p>{event.detail}</p></div><time>{event.time}</time></div>)}</div> : <p className="widget-empty">Detailed event timelines will appear when replay/session event storage is enabled.</p>}</div>
      <button className="button button-dark replay-button" type="button">Watch session replay →</button>
    </section>
  );
}
