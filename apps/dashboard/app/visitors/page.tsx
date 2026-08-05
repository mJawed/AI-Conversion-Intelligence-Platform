"use client";

import { useEffect, useState } from "react";
import { DashboardShell, EmptyState, PageHeader } from "../components/dashboard-shell";
import { Button, ErrorState, LoadingState } from "../components/ui";
import { visitors as mockVisitors, type SessionEvent, type Visitor } from "../data/mock";
import { getAuthenticatedAnalytics } from "../lib/api-client";
import { useAccount, useMockData } from "../lib/account-context";
import { VisitorsView } from "./visitors-view";

type LiveTimelineEvent = { time: string; title: string; detail: string; icon: string };
type LiveVisitor = { visitor_id: string; last_seen: string; sessions: number; events: number; conversions: number; current_page: string; device?: Visitor["device"]; browser?: string; source?: string; scrollDepth?: number; timeline?: LiveTimelineEvent[] };
type VisitorsResponse = { visitors: LiveVisitor[]; pagination: { hasMore: boolean } };

const ranges = [{ label: "Last 7 days", days: 7 }, { label: "Last 30 days", days: 30 }, { label: "Last 90 days", days: 90 }] as const;
function queryFor(days: number, organizationId: string, websiteId: string) { const to = new Date(); const from = new Date(to.getTime() - days * 86400000); return { organizationId, websiteId, from: from.toISOString(), to: to.toISOString(), limit: "50", offset: "0", sort: "recent" }; }
function mapVisitor(visitor: LiveVisitor): Visitor { const converted = Number(visitor.conversions) > 0; const timeline: SessionEvent[] = (visitor.timeline ?? []).map((event) => ({ ...event, time: new Date(event.time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) })); return { id: visitor.visitor_id, initials: "AN", name: "Anonymous visitor", status: converted ? "Converted" : "Active", currentPage: visitor.current_page || "Not available", device: visitor.device || "Not available", country: "Not available", browser: visitor.browser || "Not available", source: visitor.source || "Not available", lastSeen: new Date(visitor.last_seen).toLocaleString(), duration: "Not available", scrollDepth: Number(visitor.scrollDepth || 0), sessions: Number(visitor.sessions), events: Number(visitor.events), timeline }; }

export default function VisitorsPage() {
  const account = useAccount();
  const [rangeDays, setRangeDays] = useState(30);
  const [liveVisitors, setLiveVisitors] = useState<Visitor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!useMockData);
  const [retryKey, setRetryKey] = useState(0);
  const selectedRange = ranges.find((range) => range.days === rangeDays) ?? ranges[1];

  useEffect(() => {
    if (useMockData || !account.tokens?.accessToken || !account.selectedOrganization || !account.selectedWebsite) { setIsLoading(false); return; }
    let cancelled = false;
    setIsLoading(true); setError(null);
    getAuthenticatedAnalytics<VisitorsResponse>("visitors", account.tokens.accessToken, queryFor(rangeDays, account.selectedOrganization.id, account.selectedWebsite.id)).then((result) => { if (!cancelled) setLiveVisitors(result.visitors.map(mapVisitor)); }).catch((requestError) => { if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Could not load visitors."); }).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [account.selectedOrganization, account.selectedWebsite, account.tokens, rangeDays, retryKey]);

  const visitors = useMockData ? mockVisitors : liveVisitors;
  return <DashboardShell activeHref="/visitors"><PageHeader eyebrow="Visitor analytics" title="Understand every journey." action={<Button>Export report ↓</Button>} /><div className="page-intro"><p>Explore sessions, identify intent, and find the moments that shape conversion.</p><select className="date-pill" value={rangeDays} onChange={(event) => setRangeDays(Number(event.target.value))} aria-label="Visitor date range">{ranges.map((range) => <option key={range.days} value={range.days}>{range.label}</option>)}</select></div>{!useMockData && account.isLoading ? <LoadingState /> : !useMockData && !account.selectedWebsite ? <EmptyState title="Select or connect a website" description="Create a website and install tracking before visitor journeys can appear." /> : !useMockData && error ? <ErrorState message={error} onRetry={() => setRetryKey((key) => key + 1)} /> : !useMockData && isLoading ? <LoadingState /> : !useMockData && visitors.length === 0 ? <EmptyState title="No visitors in this period" description={`No visitor events were recorded in ${selectedRange.label.toLowerCase()}.`} /> : <VisitorsView visitors={visitors} live={!useMockData} />}</DashboardShell>;
}
