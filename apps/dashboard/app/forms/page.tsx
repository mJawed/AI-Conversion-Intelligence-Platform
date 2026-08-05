"use client";

import { useEffect, useState } from "react";
import { DashboardShell, EmptyState, PageHeader } from "../components/dashboard-shell";
import { Button, ErrorState, LoadingState } from "../components/ui";
import { forms as mockForms, type FormAnalytics } from "../data/mock";
import { getAuthenticatedAnalytics } from "../lib/api-client";
import { useAccount, useMockData } from "../lib/account-context";
import { FormsView } from "./forms-view";

type LiveForm = { form_id: string; path: string; started: number; completed: number; errors: number; completionRate: number; abandonmentRate: number };
type FormsResponse = { forms: LiveForm[] };
const ranges = [{ label: "Last 7 days", days: 7 }, { label: "Last 30 days", days: 30 }, { label: "Last 90 days", days: 90 }] as const;
function queryFor(days: number, organizationId: string, websiteId: string) { const to = new Date(); const from = new Date(to.getTime() - days * 86400000); return { organizationId, websiteId, from: from.toISOString(), to: to.toISOString(), limit: "50", offset: "0" }; }
function mapForm(form: LiveForm): FormAnalytics { const started = Number(form.started); const completed = Number(form.completed); const errors = Number(form.errors); const lowCompletion = started >= 5 && Number(form.completionRate) < 50; return { id: form.form_id, name: form.form_id, path: form.path || "Not available", started: started.toLocaleString(), completed: completed.toLocaleString(), completionRate: `${Number(form.completionRate).toFixed(2)}%`, abandonmentRate: `${Number(form.abandonmentRate).toFixed(2)}%`, avgTime: "Not available", submissions: completed.toLocaleString(), validationErrors: errors, fields: [], recommendation: { title: errors > 0 ? "Validation errors are creating form friction" : lowCompletion ? "More than half of form starters abandon before submission" : "Form performance is being monitored", reason: errors > 0 ? `${errors} privacy-safe validation errors were recorded without storing field names or values.` : lowCompletion ? `${Number(form.abandonmentRate).toFixed(1)}% of form starters did not submit the form.` : "Collect more form activity to identify a reliable optimization opportunity.", impact: errors > 0 || lowCompletion ? "+5–12% completions" : "Not available", priority: errors > 0 && lowCompletion ? "High" : errors > 0 || lowCompletion ? "Medium" : "Low" } }; }

export default function FormsPage() {
  const account = useAccount();
  const [rangeDays, setRangeDays] = useState(30);
  const [liveForms, setLiveForms] = useState<FormAnalytics[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!useMockData);
  const [retryKey, setRetryKey] = useState(0);
  useEffect(() => {
    if (useMockData || !account.tokens?.accessToken || !account.selectedOrganization || !account.selectedWebsite) { setIsLoading(false); return; }
    let cancelled = false; setIsLoading(true); setError(null);
    getAuthenticatedAnalytics<FormsResponse>("forms", account.tokens.accessToken, queryFor(rangeDays, account.selectedOrganization.id, account.selectedWebsite.id)).then((result) => { if (!cancelled) setLiveForms(result.forms.map(mapForm)); }).catch((requestError) => { if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Could not load form analytics."); }).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [account.selectedOrganization, account.selectedWebsite, account.tokens, rangeDays, retryKey]);
  const forms = useMockData ? mockForms : liveForms;
  return <DashboardShell activeHref="/forms"><PageHeader eyebrow="Form intelligence" title="Remove conversion friction." action={<Button>＋ Track a form</Button>} /><div className="page-intro"><p>See where visitors hesitate, make fixes with confidence, and improve completion rates.</p><select className="date-pill" value={rangeDays} onChange={(event) => setRangeDays(Number(event.target.value))} aria-label="Forms date range">{ranges.map((range) => <option key={range.days} value={range.days}>{range.label}</option>)}</select></div>{!useMockData && account.isLoading ? <LoadingState /> : !useMockData && !account.selectedWebsite ? <EmptyState title="Select or connect a website" description="Create a website and install tracking before form analytics can appear." /> : !useMockData && error ? <ErrorState message={error} onRetry={() => setRetryKey((key) => key + 1)} /> : !useMockData && isLoading ? <LoadingState /> : !useMockData && forms.length === 0 ? <EmptyState title="No forms recorded for this period" description="Form-start and form-submit events will appear after your tracking script receives form activity." /> : <FormsView forms={forms} live={!useMockData} />}</DashboardShell>;
}
