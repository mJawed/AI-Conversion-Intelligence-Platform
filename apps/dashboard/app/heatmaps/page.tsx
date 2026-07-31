"use client";

import { useEffect, useState } from "react";
import { DashboardShell, EmptyState, PageHeader } from "../components/dashboard-shell";
import { Button, ErrorState, LoadingState } from "../components/ui";
import { heatmapPoints as mockPoints } from "../data/mock";
import { getAuthenticatedAnalytics } from "../lib/api-client";
import { useAccount, useMockData } from "../lib/account-context";
import { HeatmapsView } from "./heatmaps-view";

type HeatmapRow = { url: string; clicks: number; visitors: number };
type HeatmapsResponse = { heatmaps: HeatmapRow[]; message?: string };
const ranges = [{ label: "Last 7 days", days: 7 }, { label: "Last 30 days", days: 30 }, { label: "Last 90 days", days: 90 }] as const;
function queryFor(days: number, organizationId: string, websiteId: string) { const to = new Date(); const from = new Date(to.getTime() - days * 86400000); return { organizationId, websiteId, from: from.toISOString(), to: to.toISOString(), limit: "50", offset: "0" }; }

export default function HeatmapsPage() {
  const account = useAccount();
  const [rangeDays, setRangeDays] = useState(30);
  const [rows, setRows] = useState<HeatmapRow[]>([]);
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!useMockData);
  const [retryKey, setRetryKey] = useState(0);
  useEffect(() => {
    if (useMockData || !account.tokens?.accessToken || !account.selectedOrganization || !account.selectedWebsite) { setIsLoading(false); return; }
    let cancelled = false; setIsLoading(true); setError(null);
    getAuthenticatedAnalytics<HeatmapsResponse>("heatmaps", account.tokens.accessToken, queryFor(rangeDays, account.selectedOrganization.id, account.selectedWebsite.id)).then((result) => { if (!cancelled) { setRows(result.heatmaps); setMessage(result.message); } }).catch((requestError) => { if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Could not load heatmap analytics."); }).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [account.selectedOrganization, account.selectedWebsite, account.tokens, rangeDays, retryKey]);
  return <DashboardShell activeHref="/heatmaps"><PageHeader eyebrow="Heatmaps" title="See attention in context." action={<Button>Export heatmap ↓</Button>} /><div className="page-intro"><p>Visualize clicks, attention, and dead zones across the pages that matter most.</p><select className="date-pill" value={rangeDays} onChange={(event) => setRangeDays(Number(event.target.value))} aria-label="Heatmap date range">{ranges.map((range) => <option key={range.days} value={range.days}>{range.label}</option>)}</select></div>{!useMockData && account.isLoading ? <LoadingState /> : !useMockData && !account.selectedWebsite ? <EmptyState title="Select or connect a website" description="Create a website and install tracking before heatmaps can appear." /> : !useMockData && error ? <ErrorState message={error} onRetry={() => setRetryKey((key) => key + 1)} /> : !useMockData && isLoading ? <LoadingState /> : !useMockData && rows.length === 0 ? <EmptyState title="No click data for this period" description="Click events will appear after your tracking script receives traffic." /> : <HeatmapsView points={mockPoints} live={!useMockData} rows={rows} message={message} />}</DashboardShell>;
}
