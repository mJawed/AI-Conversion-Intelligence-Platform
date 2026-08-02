"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell, EmptyState, PageHeader } from "./dashboard-shell";
import { InsightPreview, RealtimeCard, TopPages, TrafficChart } from "./overview-widgets";
import { ErrorState, LoadingState } from "./ui";
import { insightPreviews, overviewMetrics, topPages, trafficTrend, type InsightPreview as InsightPreviewType, type Metric, type TopPage, type TrendPoint } from "../data/mock";
import { getAuthenticatedAnalytics, getLiveTracking, type LiveTracking } from "../lib/api-client";
import { useAccount, useMockData } from "../lib/account-context";

type OverviewResponse = {
  metrics: { visitors: number; sessions: number; conversions: number; page_views: number; conversionRate: number; bounceRate?: number | null; avgSessionSeconds?: number | null };
  topPages: Array<{ path: string; visitors: number; share: number }>;
  traffic: Array<{ day: string; visitors: number }>;
};

const ranges = [{ label: "Last 7 days", days: 7 }, { label: "Last 30 days", days: 30 }, { label: "Last 90 days", days: 90 }] as const;

function queryFor(days: number, organizationId: string, websiteId: string) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { organizationId, websiteId, from: from.toISOString(), to: to.toISOString(), limit: "10", offset: "0" };
}

function formatNumber(value: number) { return new Intl.NumberFormat("en-US").format(value); }
function formatPercent(value: number | null | undefined) { return value === null || value === undefined ? "—" : `${value.toFixed(2)}%`; }
function formatDuration(seconds: number | null | undefined) { if (seconds === null || seconds === undefined) return "—"; const minutes = Math.floor(seconds / 60).toString().padStart(2, "0"); return `${minutes}:${Math.round(seconds % 60).toString().padStart(2, "0")}`; }
function formatDay(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric" }); }

function liveMetrics(data: OverviewResponse, live: LiveTracking["live"] | null): Metric[] {
  return [
    { label: "Visitors", value: formatNumber(Number(data.metrics.visitors)), detail: "Unique visitors this period", change: "Live", tone: "neutral" },
    { label: "Sessions", value: formatNumber(Number(data.metrics.sessions)), detail: "Total sessions this period", change: "Live", tone: "neutral" },
    { label: "Conversion rate", value: formatPercent(Number(data.metrics.conversionRate)), detail: "Recorded conversion events", change: "Live", tone: "neutral" },
    { label: "Avg. session", value: formatDuration(data.metrics.avgSessionSeconds), detail: "Average session duration", change: data.metrics.avgSessionSeconds === null || data.metrics.avgSessionSeconds === undefined ? "Not available" : "Live", tone: "neutral" },
    { label: "Bounce rate", value: formatPercent(data.metrics.bounceRate), detail: "Single-event sessions", change: data.metrics.bounceRate === null || data.metrics.bounceRate === undefined ? "Not available" : "Live", tone: "neutral" },
    { label: "Live visitors", value: live ? formatNumber(live.activeVisitors) : "—", detail: live ? "Visitors active in the last 5 minutes" : "Realtime activity unavailable", change: live ? "Live" : "Unavailable", tone: "neutral" },
  ];
}

export function OverviewView() {
  const account = useAccount();
  const [rangeDays, setRangeDays] = useState(30);
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!useMockData);
  const [retryKey, setRetryKey] = useState(0);
  const [live, setLive] = useState<LiveTracking["live"] | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveLoading, setLiveLoading] = useState(!useMockData);
  const [liveStale, setLiveStale] = useState(false);
  const [liveRetryKey, setLiveRetryKey] = useState(0);
  const selectedRange = ranges.find((range) => range.days === rangeDays) ?? ranges[1];

  useEffect(() => {
    if (useMockData) return;
    if (!account.tokens?.accessToken || !account.selectedOrganization || !account.selectedWebsite) {
      setData(null);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    getAuthenticatedAnalytics<OverviewResponse>("overview", account.tokens.accessToken, queryFor(rangeDays, account.selectedOrganization.id, account.selectedWebsite.id)).then((result) => {
      if (!cancelled) setData(result);
    }).catch((requestError) => {
      if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Could not load overview analytics.");
    }).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [account.selectedOrganization, account.selectedWebsite, account.tokens, rangeDays, retryKey]);

  useEffect(() => {
    if (useMockData || !account.tokens?.accessToken || !account.selectedOrganization || !account.selectedWebsite) {
      setLive(null);
      setLiveLoading(false);
      setLiveStale(false);
      return;
    }
    let cancelled = false;
    let firstRequest = true;
    let inFlight = false;
    let consecutiveFailures = 0;
    let pollingStopped = false;
    const loadLive = async () => {
      if (inFlight || pollingStopped || document.visibilityState !== "visible") return;
      inFlight = true;
      if (firstRequest) setLiveLoading(true);
      setLiveError(null);
      try {
        const result = await getLiveTracking(account.tokens!.accessToken, { organizationId: account.selectedOrganization!.id, websiteId: account.selectedWebsite!.id });
        if (!cancelled) { consecutiveFailures = 0; setLive(result.live); setLiveStale(false); }
      } catch (requestError) {
        consecutiveFailures += 1;
        if (!cancelled) {
          setLiveError(requestError instanceof Error ? requestError.message : "Could not load live activity.");
          if (consecutiveFailures >= 3) { pollingStopped = true; setLiveStale(true); }
        }
      } finally {
        inFlight = false;
        if (!cancelled) { firstRequest = false; setLiveLoading(false); }
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      pollingStopped = false;
      consecutiveFailures = 0;
      void loadLive();
    };
    void loadLive();
    const interval = window.setInterval(() => { if (document.visibilityState === "visible") void loadLive(); }, 15000);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => { cancelled = true; window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisibilityChange); };
  }, [account.selectedOrganization, account.selectedWebsite, account.tokens, liveRetryKey]);

  const metrics = useMockData ? overviewMetrics : data ? liveMetrics(data, live) : [];
  const points: TrendPoint[] = useMockData ? trafficTrend : (data?.traffic ?? []).map((point) => ({ label: formatDay(point.day), value: Number(point.visitors) }));
  const pages: TopPage[] = useMockData ? topPages : (data?.topPages ?? []).map((page) => ({ path: page.path, visitors: formatNumber(Number(page.visitors)), share: `${Number(page.share).toFixed(1)}%` }));
  const insights: InsightPreviewType[] = useMockData ? insightPreviews : [];
  const hasLiveData = useMockData || Boolean(account.selectedWebsite);
  const isEmpty = !useMockData && data && Number(data.metrics.visitors) === 0 && points.length === 0;
  const websiteLabel = account.selectedWebsite?.name ?? "Select website";

  const dashboardContent = useMemo(() => {
    if (!useMockData && account.isLoading && !account.selectedWebsite) return <LoadingState />;
    if (!hasLiveData) return <EmptyState title="Connect a website to see growth signals" description="Create your first website and install the tracking script before analytics can appear." action={<Link className="button button-dark" href="/onboarding">＋ Add website</Link>} />;
    if (!useMockData && error) return <ErrorState message={error} onRetry={() => setRetryKey((key) => key + 1)} />;
    if (!useMockData && isLoading) return <LoadingState />;
    if (!useMockData && isEmpty) return <EmptyState title="No visitor data for this period" description="Once your tracking script receives events, your visitors, sessions, and conversion signals will appear here." action={<Link className="button button-dark" href="/settings">Check installation</Link>} />;
    return <>
      <div className="metrics">{metrics.map((metric) => <article className="metric" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><p>{metric.detail} <span className={`metric-change ${metric.tone ?? "neutral"}`}>{metric.change}</span></p></article>)}</div>
      <div className="overview-grid"><TrafficChart points={points} /><RealtimeCard available live={live} loading={liveLoading} error={liveError} stale={liveStale} onRetry={() => setLiveRetryKey((key) => key + 1)} /></div>
      <div className="overview-grid lower-grid"><TopPages pages={pages} /><InsightPreview insights={insights} empty={!useMockData} /></div>
      <div className="setup-reminder"><div><strong>Want to connect another website?</strong><p>Install the tracking SDK and start collecting conversion signals.</p></div><Link className="button button-dark" href="/onboarding">＋ Add website</Link></div>
    </>;
  }, [account, data, error, hasLiveData, insights, isEmpty, isLoading, live, liveError, liveLoading, liveStale, metrics, pages, points, useMockData]);

  return <DashboardShell><PageHeader action={<Link className="button" href="/onboarding">＋ Add website</Link>} /><div className="section-heading"><div><p className="eyebrow">Overview</p><h2>Your growth signals</h2></div><div className="filters"><label className="sr-only" htmlFor="overview-website">Website</label><select id="overview-website" className="website-pill" value={account.selectedWebsite?.id ?? ""} onChange={(event) => account.selectWebsite(event.target.value)} disabled={useMockData || account.websites.length === 0}><option value="">{websiteLabel}</option>{account.websites.map((website) => <option key={website.id} value={website.id}>{website.name}</option>)}</select><label className="sr-only" htmlFor="overview-range">Date range</label><select id="overview-range" className="date-pill" value={rangeDays} onChange={(event) => setRangeDays(Number(event.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select></div></div>{useMockData && <p className="mock-notice">Demo data is enabled. Set <code>NEXT_PUBLIC_USE_MOCK_DATA=false</code> to view live analytics.</p>}{dashboardContent}</DashboardShell>;
}
