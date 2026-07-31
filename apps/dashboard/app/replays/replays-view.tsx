"use client";

import { useState } from "react";
import type { ReplaySession } from "../data/mock";

export function ReplaysView({ sessions }: Readonly<{ sessions: ReplaySession[] }>) {
  const [selectedId, setSelectedId] = useState(sessions[0]?.id ?? "");
  const selected = sessions.find((session) => session.id === selectedId) ?? sessions[0];
  if (!selected) return null;
  return <div className="replays-layout"><section className="replay-list-panel"><div className="list-heading"><div><p className="eyebrow">Sessions</p><h2>{sessions.length} replays available</h2></div><span className="list-meta">Last 30 days</span></div><div className="replay-list">{sessions.map((session) => <button className={session.id === selected.id ? "replay-row selected" : "replay-row"} key={session.id} onClick={() => setSelectedId(session.id)} type="button"><span className="avatar">{session.initials}</span><span className="replay-summary"><strong>{session.page}</strong><span>{session.device} · {session.country}</span></span><span className={`replay-status replay-${session.status.toLowerCase()}`}>{session.status}</span><small>{session.time}</small></button>)}</div></section><ReplayDetail session={selected} /></div>;
}

function ReplayDetail({ session }: Readonly<{ session: ReplaySession }>) {
  return <section className="replay-detail"><div className="detail-heading"><div className="detail-identity"><span className="avatar avatar-large">{session.initials}</span><div><p className="eyebrow">Session {session.id}</p><h2>{session.page}</h2><span className={`replay-status replay-${session.status.toLowerCase()}`}>{session.status}</span></div></div><span className="list-meta">{session.time}</span></div><div className="replay-player"><div className="player-top"><span>AI Growth</span><span>{session.page}</span></div><div className="player-screen"><div className="player-cursor" /><div className="player-line wide" /><div className="player-line" /><div className="player-button">{session.status === "Converted" ? "Purchase completed" : "Start free trial"}</div></div><div className="player-controls"><button type="button" aria-label="Play replay">▶</button><div className="player-progress"><i style={{ width: "42%" }} /></div><span>{session.duration}</span></div></div><div className="replay-summary-card"><div className="recommendation-top"><div><p className="eyebrow">AI session summary</p><h3>What happened</h3></div><span className="recommendation-spark">✦</span></div><p>{session.summary}</p></div><div className="detail-section"><div className="detail-section-heading"><h3>Replay timeline</h3><span className="list-meta">{session.events} events</span></div><div className="timeline">{session.timeline.map((event) => <div className="timeline-event" key={`${event.time}-${event.title}`}><span className="timeline-icon">{event.icon}</span><div><strong>{event.title}</strong><p>{event.detail}</p></div><time>{event.time}</time></div>)}</div></div></section>;
}
