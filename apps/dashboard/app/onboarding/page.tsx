"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useAccount, useMockData } from "../lib/account-context";
import { getTrackingScript, verifyTracking, type ApiWebsite } from "../lib/api-client";

function normalizeDomain(value: string) {
  const candidate = /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`;
  const url = new URL(candidate);
  if (!url.hostname || url.pathname !== "/" || url.search || url.hash) throw new Error("Enter only your domain, without a page path.");
  return url.hostname.toLowerCase();
}

export default function OnboardingPage() {
  const account = useAccount();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [website, setWebsite] = useState<ApiWebsite | null>(null);
  const [snippet, setSnippet] = useState("");
  const [statusMessage, setStatusMessage] = useState("Install the script, then check your connection.");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!useMockData && !account.isLoading && !account.tokens) window.location.href = "/login";
  }, [account.isLoading, account.tokens]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    let normalizedDomain: string;
    try {
      normalizedDomain = normalizeDomain(domain);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Enter a valid domain.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (useMockData) {
        setWebsite({ id: "mock-website", organizationId: "mock-org", name: name.trim(), domain: normalizedDomain, trackingId: "trk_demo_123456", timezone: "UTC", currency: "USD", industry: "SaaS / Technology", status: "ACTIVE", installationStatus: "NOT_INSTALLED", trackingVerifiedAt: null, firstEventAt: null, lastEventAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        return;
      }
      const created = await account.createWebsite({ name: name.trim(), domain: normalizedDomain, timezone: "UTC", currency: "USD", industry: "SaaS / Technology" });
      setWebsite(created);
      if (account.tokens?.accessToken && account.selectedOrganization) {
        const tracking = await getTrackingScript(account.tokens.accessToken, account.selectedOrganization.id, created.id);
        setSnippet(tracking.tracking.snippet);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create your website.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function checkConnection() {
    if (!website || useMockData || !account.tokens?.accessToken || !account.selectedOrganization) {
      setStatusMessage("In live mode, install the script first so we can detect the first event.");
      return;
    }
    setIsVerifying(true);
    setError(null);
    try {
      const result = await verifyTracking(account.tokens.accessToken, account.selectedOrganization.id, website.id, website.domain);
      setStatusMessage(result.verified ? "Tracking is connected and receiving events." : result.message ?? "Tracking has not been detected yet.");
      if (result.verified) setWebsite({ ...website, installationStatus: "VERIFIED", firstEventAt: result.firstEventAt ?? website.firstEventAt });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Verification failed.");
    } finally {
      setIsVerifying(false);
    }
  }

  if (website) return <main className="onboarding-page"><div className="onboarding-brand"><span className="brand-mark">✦</span><strong>AI Growth</strong></div><div className="onboarding-card"><div className="onboarding-progress"><span className="progress-active" /><span className="progress-active" /><span /></div><p className="eyebrow">Website setup · Step 2 of 3</p><h1>Install your tracking script.</h1><p className="onboarding-lead">Add this snippet before the closing <code>&lt;/head&gt;</code> tag on every page of {website.domain}.</p><div className="onboarding-status"><span className={website.installationStatus === "VERIFIED" ? "status-badge status-verified" : "status-badge"}>{website.installationStatus === "VERIFIED" ? "Verified" : "Needs setup"}</span><strong>{statusMessage}</strong></div><pre className="onboarding-code">{snippet || `<script async src="${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/tracker.js" data-tracking-id="${website.trackingId}"></script>`}</pre><div className="onboarding-actions"><button className="button" type="button" onClick={() => void navigator.clipboard?.writeText(snippet)}>Copy script</button><button className="button button-dark" disabled={isVerifying || website.installationStatus === "VERIFIED"} type="button" onClick={() => void checkConnection()}>{isVerifying ? "Checking…" : website.installationStatus === "VERIFIED" ? "Connection verified" : "Check connection"}</button></div>{error && <p className="form-error" role="alert">{error}</p>}<p className="onboarding-troubleshooting"><strong>Not detected?</strong> Confirm the script is published on the exact domain, disable ad blockers for your test visit, then wait a few seconds and try again.</p><p className="onboarding-footnote"><Link href="/settings">Open installation settings</Link> · <Link href="/">Go to dashboard</Link></p></div></main>;

  return <main className="onboarding-page"><div className="onboarding-brand"><span className="brand-mark">✦</span><strong>AI Growth</strong></div><form className="onboarding-card" onSubmit={handleCreate}><div className="onboarding-progress"><span className="progress-active" /><span /><span /></div><p className="eyebrow">Website setup · Step 1 of 3</p><h1>Connect your first website.</h1><p className="onboarding-lead">Add a website to start seeing visitor behaviour, conversion leaks, and AI recommendations.</p><label className="onboarding-label">Website name<input autoComplete="organization" placeholder="e.g. Acme website" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={100} required /></label><label className="onboarding-label">Website URL<input autoComplete="url" placeholder="https://yourwebsite.com" value={domain} onChange={(event) => setDomain(event.target.value)} required /><small className="field-help">Use a domain only, such as example.com or https://example.com.</small></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-dark onboarding-next" disabled={isSubmitting} type="submit">{isSubmitting ? "Creating website…" : "Continue to tracking setup →"}</button><p className="onboarding-footnote">You can add more websites after setup.</p></form></main>;
}
