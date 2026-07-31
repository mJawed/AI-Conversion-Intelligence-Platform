"use client";

import { useEffect, useState } from "react";
import { DashboardShell, EmptyState, PageHeader } from "../components/dashboard-shell";
import { Button, ErrorState, LoadingState } from "../components/ui";
import { replaySessions as mockSessions, type ReplaySession } from "../data/mock";
import { getAuthenticatedAnalytics } from "../lib/api-client";
import { useAccount, useMockData } from "../lib/account-context";
import { ReplaysView } from "./replays-view";

type LiveReplay = { session_id: string; visitor_id: string; started_at: string; last_seen: string; events: number; converted: boolean };
type ReplaysResponse = { replays: LiveReplay[] };
const ranges = [{ label: "Last 7 days", days: 7 }, { label: "Last 30 days", days: 30 }, { label: "Last 90 days", days: 90 }] as const;
function queryFor(days: number, organizationId: string, websiteId: string) { const to = new Date(); const from = new Date(to.getTime() - days * 86400000); return { organizationId, websiteId, from: from.toISOString(), to: to.toISOString(), limit: "50", offset: "0" }; }
function duration(start: string, end: string) { const seconds = Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 1000); return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.round(seconds % 60).toString().padStart(2, "0")}`; }
function mapReplay(replay: LiveReplay): ReplaySession { const status: ReplaySession["status"] = replay.converted ? "Converted" : "Exploring"; return { id: replay.session_id, initials: "AN", page: "Page unavailable", device: "Not available", country: "Not available", duration: duration(replay.started_at, replay.last_seen), time: new Date(replay.last_seen).toLocaleString(), events: Number(replay.events), status, summary: "Session event aggregates are available. Full replay playback and AI summaries require session recording storage.", timeline: [] }; }

export default function ReplaysPage() {
  const account = useAccount();
  const [rangeDays, setRangeDays] = useState(30);
  const [liveSessions, setLiveSessions] = useState<ReplaySession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!useMockData);
  const [retryKey, setRetryKey] = useState(0);
  useEffect(() => {
    if (useMockData || !account.tokens?.accessToken || !account.selectedOrganization || !account.selectedWebsite) { setIsLoading(false); return; }
    let cancelled = false; setIsLoading(true); setError(null);
    getAuthenticatedAnalytics<ReplaysResponse>("replays", account.tokens.accessToken, queryFor(rangeDays, account.selectedOrganization.id, account.selectedWebsite.id)).then((result) => { if (!cancelled) setLiveSessions(result.replays.map(mapReplay)); }).catch((requestError) => { if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Could not load session replays."); }).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [account.selectedOrganization, account.selectedWebsite, account.tokens, rangeDays, retryKey]);
  const sessions = useMockData ? mockSessions : liveSessions;
  return <DashboardShell activeHref="/replays"><PageHeader eyebrow="Session replay" title="Watch the moments that matter." action={<Button>Filter sessions ▾</Button>} /><div className="page-intro"><p>Review real journeys, understand friction, and let AI summarize the important moments.</p><select className="date-pill" value={rangeDays} onChange={(event) => setRangeDays(Number(event.target.value))} aria-label="Replay date range">{ranges.map((range) => <option key={range.days} value={range.days}>{range.label}</option>)}</select></div>{!useMockData && account.isLoading ? <LoadingState /> : !useMockData && !account.selectedWebsite ? <EmptyState title="Select or connect a website" description="Create a website and install tracking before session data can appear." /> : !useMockData && error ? <ErrorState message={error} onRetry={() => setRetryKey((key) => key + 1)} /> : !useMockData && isLoading ? <LoadingState /> : !useMockData && sessions.length === 0 ? <EmptyState title="No sessions in this period" description="Session aggregates will appear after your tracking script receives visitor events." /> : <ReplaysView sessions={sessions} live={!useMockData} />}</DashboardShell>;
}
