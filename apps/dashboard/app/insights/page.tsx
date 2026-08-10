"use client";

import { useEffect, useState } from "react";
import { DashboardShell, EmptyState, PageHeader } from "../components/dashboard-shell";
import { Button, ErrorState, LoadingState } from "../components/ui";
import { aiInsights, type AIInsight } from "../data/mock";
import { getAuthenticatedAnalytics, updateInsightAssignment, updateInsightStatus } from "../lib/api-client";
import { useAccount, useMockData } from "../lib/account-context";
import { InsightsView } from "./insights-view";

export type InsightAlert = { id: string; source?: string; category: AIInsight["category"]; title: string; page: string; created: string; updated: string };
type InsightsResponse = { insights: AIInsight[]; alerts?: InsightAlert[]; alertCount?: number; message?: string; unavailableSources?: string[] };
const ranges = [{ label: "Last 7 days", days: 7 }, { label: "Last 30 days", days: 30 }, { label: "Last 90 days", days: 90 }] as const;
function queryFor(days: number, organizationId: string, websiteId: string) { const to = new Date(); const from = new Date(to.getTime() - days * 86400000); return { organizationId, websiteId, from: from.toISOString(), to: to.toISOString(), limit: "50", offset: "0", sort: "confidence" }; }

export default function InsightsPage() {
  const account = useAccount();
  const [rangeDays, setRangeDays] = useState(30);
  const [liveInsights, setLiveInsights] = useState<AIInsight[]>([]);
  const [message, setMessage] = useState<string | undefined>();
  const [unavailableSources, setUnavailableSources] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<InsightAlert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!useMockData);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (useMockData || !account.tokens?.accessToken || !account.selectedOrganization || !account.selectedWebsite) { setIsLoading(false); return; }
    let cancelled = false;
    setIsLoading(true); setError(null);
    getAuthenticatedAnalytics<InsightsResponse>("insights", account.tokens.accessToken, queryFor(rangeDays, account.selectedOrganization.id, account.selectedWebsite.id)).then((result) => { if (!cancelled) { setLiveInsights(result.insights); setAlerts(result.alerts ?? []); setMessage(result.message); setUnavailableSources(result.unavailableSources ?? []); } }).catch((requestError) => { if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Could not load AI insights."); }).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [account.selectedOrganization, account.selectedWebsite, account.tokens, rangeDays, retryKey]);

  async function saveInsightStatus(insightId: string, status: AIInsight["status"]) {
    if (!account.tokens?.accessToken || !account.selectedOrganization || !account.selectedWebsite) return;
    const apiStatus = status === "Resolved" ? "RESOLVED" : status === "Dismissed" ? "DISMISSED" : status === "Saved" ? "SAVED" : "OPEN";
    await updateInsightStatus(account.tokens.accessToken, account.selectedOrganization.id, account.selectedWebsite.id, insightId, apiStatus);
    setLiveInsights((current) => current.map((insight) => insight.id === insightId ? { ...insight, status } : insight));
  }
  async function saveInsightAssignment(insightId: string, assigned: boolean) {
    if (!account.tokens?.accessToken || !account.selectedOrganization || !account.selectedWebsite) return;
    const result = await updateInsightAssignment(account.tokens.accessToken, account.selectedOrganization.id, account.selectedWebsite.id, insightId, assigned ? "self" : null);
    setLiveInsights((current) => current.map((insight) => insight.id === insightId ? { ...insight, assignedToId: result.insight.assignedToId } : insight));
  }
  const insights = useMockData ? aiInsights : liveInsights;
  return <DashboardShell activeHref="/insights"><PageHeader eyebrow="AI insights" title="Know what to fix next." action={<Button onClick={() => setRetryKey((key) => key + 1)}>Generate report ✦</Button>} /><div className="page-intro"><p>Evidence-backed CRO recommendations ranked by confidence, impact, and urgency.</p><select className="date-pill" value={rangeDays} onChange={(event) => setRangeDays(Number(event.target.value))} aria-label="Insights date range">{ranges.map((range) => <option key={range.days} value={range.days}>{range.label}</option>)}</select></div>{!useMockData && account.isLoading ? <LoadingState /> : !useMockData && !account.selectedWebsite ? <EmptyState title="Select or connect a website" description="Create a website and install tracking before AI insights can appear." /> : !useMockData && error ? <ErrorState message={error} onRetry={() => setRetryKey((key) => key + 1)} /> : !useMockData && isLoading ? <LoadingState /> : !useMockData && insights.length === 0 ? <EmptyState title="No reliable insights yet" description={message ?? "More traffic is needed before reliable CRO insights can be generated."} action={<a className="button button-dark" href="/">View analytics</a>} /> : <InsightsView insights={insights} alerts={alerts} unavailableSources={unavailableSources} live={!useMockData} onStatusLive={saveInsightStatus} onAssignmentLive={saveInsightAssignment} />}</DashboardShell>;
}
