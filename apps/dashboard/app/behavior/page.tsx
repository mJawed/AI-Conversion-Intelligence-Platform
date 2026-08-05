"use client";

import { useEffect, useState } from "react";
import { DashboardShell, EmptyState, PageHeader } from "../components/dashboard-shell";
import { Button, ErrorState, LoadingState } from "../components/ui";
import { behaviourIssues as mockIssues, clickTargets as mockTargets, scrollPages as mockScrollPages, type BehaviourIssue, type ClickTarget } from "../data/mock";
import { getAuthenticatedAnalytics } from "../lib/api-client";
import { useAccount, useMockData } from "../lib/account-context";
import { BehaviourView } from "./behavior-view";

type BehaviourRow = { event_type: string; events: number; visitors: number };
type BehaviourResponse = { behaviour: BehaviourRow[]; clickTargets: Array<{ page: string; selector: string; clicks: number; visitors: number }>; scrollPages: Array<{ page: string; visitors: string; depth: number; fold: number }>; issues: BehaviourIssue[]; journey: Array<{ landing: string; exit: string; sessions: number }>; summary: { totalClicks: number; avgScrollDepth: number | null; rageClicks: number; deadClicks: number; scrollEvents: number } };
const ranges = [{ label: "Last 7 days", days: 7 }, { label: "Last 30 days", days: 30 }, { label: "Last 90 days", days: 90 }] as const;
function queryFor(days: number, organizationId: string, websiteId: string) { const to = new Date(); const from = new Date(to.getTime() - days * 86400000); return { organizationId, websiteId, from: from.toISOString(), to: to.toISOString(), limit: "50", offset: "0" }; }
function mapTargets(rows: BehaviourResponse["clickTargets"]): ClickTarget[] { return rows.map((row) => ({ selector: row.selector, label: `${row.selector} on ${row.page}`, clicks: String(row.clicks), rate: `${row.visitors} visitors` })); }

export default function BehaviourPage() {
  const account = useAccount();
  const [rangeDays, setRangeDays] = useState(30);
  const [rows, setRows] = useState<BehaviourRow[]>([]);
  const [signals, setSignals] = useState<BehaviourResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!useMockData);
  const [retryKey, setRetryKey] = useState(0);
  useEffect(() => {
    if (useMockData || !account.tokens?.accessToken || !account.selectedOrganization || !account.selectedWebsite) { setIsLoading(false); return; }
    let cancelled = false; setIsLoading(true); setError(null);
    getAuthenticatedAnalytics<BehaviourResponse>("behaviour", account.tokens.accessToken, queryFor(rangeDays, account.selectedOrganization.id, account.selectedWebsite.id)).then((result) => { if (!cancelled) { setRows(result.behaviour); setSignals(result); } }).catch((requestError) => { if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Could not load behaviour analytics."); }).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [account.selectedOrganization, account.selectedWebsite, account.tokens, rangeDays, retryKey]);
  const targets = useMockData ? mockTargets : mapTargets(signals?.clickTargets ?? []);
  const issues: BehaviourIssue[] = useMockData ? mockIssues : (signals?.issues ?? []);
  const scrollPages = useMockData ? mockScrollPages : (signals?.scrollPages ?? []);
  return <DashboardShell activeHref="/behavior"><PageHeader eyebrow="Behaviour analytics" title="See where experience breaks." action={<Button>Export behaviour ↓</Button>} /><div className="page-intro"><p>Turn clicks, scrolls, and navigation patterns into clear UX priorities.</p><select className="date-pill" value={rangeDays} onChange={(event) => setRangeDays(Number(event.target.value))} aria-label="Behaviour date range">{ranges.map((range) => <option key={range.days} value={range.days}>{range.label}</option>)}</select></div>{!useMockData && account.isLoading ? <LoadingState /> : !useMockData && !account.selectedWebsite ? <EmptyState title="Select or connect a website" description="Create a website and install tracking before behaviour signals can appear." /> : !useMockData && error ? <ErrorState message={error} onRetry={() => setRetryKey((key) => key + 1)} /> : !useMockData && isLoading ? <LoadingState /> : !useMockData && rows.length === 0 ? <EmptyState title="No behaviour data for this period" description="Click, scroll, and page-view events will appear after your tracking script receives traffic." /> : <BehaviourView clickTargets={targets} issues={issues} scrollPages={scrollPages} live={!useMockData} rows={rows} summary={useMockData ? undefined : signals?.summary} journey={useMockData ? undefined : signals?.journey} />}</DashboardShell>;
}
