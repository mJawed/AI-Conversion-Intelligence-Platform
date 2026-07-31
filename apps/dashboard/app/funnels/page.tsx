"use client";

import { useEffect, useState } from "react";
import { DashboardShell, EmptyState, PageHeader } from "../components/dashboard-shell";
import { Button, ErrorState, LoadingState } from "../components/ui";
import { funnels as mockFunnels } from "../data/mock";
import { getAuthenticatedAnalytics } from "../lib/api-client";
import { useAccount, useMockData } from "../lib/account-context";
import { FunnelsView } from "./funnels-view";

type FunnelsResponse = { funnels: typeof mockFunnels; message?: string };
const ranges = [{ label: "Last 7 days", days: 7 }, { label: "Last 30 days", days: 30 }, { label: "Last 90 days", days: 90 }] as const;
function queryFor(days: number, organizationId: string, websiteId: string) { const to = new Date(); const from = new Date(to.getTime() - days * 86400000); return { organizationId, websiteId, from: from.toISOString(), to: to.toISOString(), limit: "50", offset: "0" }; }

export default function FunnelsPage() {
  const account = useAccount();
  const [rangeDays, setRangeDays] = useState(30);
  const [liveFunnels, setLiveFunnels] = useState<typeof mockFunnels>([]);
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!useMockData);
  const [retryKey, setRetryKey] = useState(0);
  useEffect(() => {
    if (useMockData || !account.tokens?.accessToken || !account.selectedOrganization || !account.selectedWebsite) { setIsLoading(false); return; }
    let cancelled = false; setIsLoading(true); setError(null);
    getAuthenticatedAnalytics<FunnelsResponse>("funnels", account.tokens.accessToken, queryFor(rangeDays, account.selectedOrganization.id, account.selectedWebsite.id)).then((result) => { if (!cancelled) { setLiveFunnels(result.funnels); setMessage(result.message); } }).catch((requestError) => { if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Could not load funnels."); }).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [account.selectedOrganization, account.selectedWebsite, account.tokens, rangeDays, retryKey]);
  return <DashboardShell activeHref="/funnels"><PageHeader eyebrow="Funnel analytics" title="Find the conversion leaks." action={<Button>＋ Create funnel</Button>} /><div className="page-intro"><p>See where journeys break down and focus your next optimization on the highest-impact step.</p><select className="date-pill" value={rangeDays} onChange={(event) => setRangeDays(Number(event.target.value))} aria-label="Funnel date range">{ranges.map((range) => <option key={range.days} value={range.days}>{range.label}</option>)}</select></div>{!useMockData && account.isLoading ? <LoadingState /> : !useMockData && !account.selectedWebsite ? <EmptyState title="Select or connect a website" description="Create a website and install tracking before funnels can be measured." /> : !useMockData && error ? <ErrorState message={error} onRetry={() => setRetryKey((key) => key + 1)} /> : !useMockData && isLoading ? <LoadingState /> : !useMockData && liveFunnels.length === 0 ? <EmptyState title="Funnel configuration is not connected yet" description={message ?? "Create and manage funnels after backend funnel persistence is enabled."} /> : <FunnelsView funnels={useMockData ? mockFunnels : liveFunnels} live={!useMockData} />}</DashboardShell>;
}
