"use client";

import { useEffect, useState } from "react";
import type { WebsiteSettings } from "../data/mock";
import { getTrackingScript, verifyTracking } from "../lib/api-client";
import { useAccount, useMockData } from "../lib/account-context";
import { ErrorState, LoadingState } from "../components/ui";

const tabs = ["Website", "Installation", "Team", "Billing"] as const;

export function SettingsView({ website }: Readonly<{ website: WebsiteSettings }>) {
  const account = useAccount();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Website");
  if (!useMockData && account.isLoading && !account.selectedWebsite) return <LoadingState />;
  if (!useMockData && !account.selectedWebsite) return <ErrorState message={account.error ?? "No website is available in this organization."} onRetry={account.retry} />;
  const liveWebsite = account.selectedWebsite;
  const currentWebsite: WebsiteSettings = liveWebsite ? { ...website, name: liveWebsite.name, domain: liveWebsite.domain, trackingId: liveWebsite.trackingId, timezone: liveWebsite.timezone, currency: liveWebsite.currency, industry: liveWebsite.industry ?? "", status: liveWebsite.installationStatus === "VERIFIED" ? "Connected" : "Needs setup", plan: account.selectedOrganization?.plan ?? website.plan } : website;
  return <div className="settings-explorer"><div className="settings-tabs" role="tablist" aria-label="Settings sections">{tabs.map((item) => <button className={item === tab ? "settings-tab active" : "settings-tab"} key={item} onClick={() => setTab(item)} type="button" role="tab" aria-selected={item === tab}>{item}</button>)}</div>{tab === "Website" && <WebsiteSettingsPanel website={currentWebsite} />}{tab === "Installation" && <InstallationPanel website={currentWebsite} />}{tab === "Team" && <TeamPanel />}{tab === "Billing" && <BillingPanel website={currentWebsite} />}</div>;
}

function WebsiteSettingsPanel({ website }: Readonly<{ website: WebsiteSettings }>) {
  const account = useAccount();
  const [form, setForm] = useState({ name: website.name, domain: website.domain, industry: website.industry, timezone: website.timezone, currency: website.currency });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  useEffect(() => setForm({ name: website.name, domain: website.domain, industry: website.industry, timezone: website.timezone, currency: website.currency }), [website]);
  async function save() {
    if (useMockData || !account.selectedWebsite) return;
    setSaveState("saving");
    try { await account.updateSelectedWebsite(form); setSaveState("saved"); } catch { setSaveState("error"); }
  }
  return <div className="settings-panel"><div className="settings-panel-heading"><div><p className="eyebrow">Website settings</p><h2>Configure your website</h2></div><span className="connected-badge"><i /> {website.status}</span></div><div className="settings-form"><label>Website name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Domain<input value={form.domain} onChange={(event) => setForm({ ...form, domain: event.target.value })} /></label><label>Industry<select value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })}><option value="SaaS / Technology">SaaS / Technology</option><option value="E-commerce">E-commerce</option><option value="Professional services">Professional services</option><option value="Media / Publishing">Media / Publishing</option></select></label><label>Timezone<select value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })}><option>Asia/Kolkata</option><option>UTC</option><option>America/New_York</option><option>Europe/London</option></select></label><label>Currency<select value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })}><option>USD</option><option>INR</option><option>EUR</option><option>GBP</option></select></label></div><div className="settings-actions"><button className="button button-dark" disabled={saveState === "saving"} onClick={save} type="button">{saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Save changes"}</button><button className="button" type="button">Archive website</button>{saveState === "error" && <span className="form-error">Could not save changes.</span>}</div></div>;
}

function InstallationPanel({ website }: Readonly<{ website: WebsiteSettings }>) {
  const account = useAccount();
  const [snippet, setSnippet] = useState(`<script src="https://app.aigrowth.dev/tracker.js"\n  data-tracking-id="${website.trackingId}"></script>`);
  const [verifyMessage, setVerifyMessage] = useState(website.status === "Connected" ? "Tracking is connected." : "Visit your website after installing the script.");
  useEffect(() => {
    if (useMockData || !account.tokens?.accessToken || !account.selectedOrganization || !account.selectedWebsite) return;
    getTrackingScript(account.tokens.accessToken, account.selectedOrganization.id, account.selectedWebsite.id).then((result) => setSnippet(result.tracking.snippet)).catch(() => undefined);
  }, [account.tokens, account.selectedOrganization, account.selectedWebsite]);
  async function verify() {
    if (useMockData || !account.tokens?.accessToken || !account.selectedOrganization || !account.selectedWebsite) return;
    try { const result = await verifyTracking(account.tokens.accessToken, account.selectedOrganization.id, account.selectedWebsite.id, website.domain); setVerifyMessage(result.verified ? "Tracking is connected." : result.message ?? "Tracking has not been detected yet."); } catch (error) { setVerifyMessage(error instanceof Error ? error.message : "Verification failed."); }
  }
  return <div className="settings-panel"><div className="settings-panel-heading"><div><p className="eyebrow">Tracking setup</p><h2>Connect {website.domain}</h2></div><span className="connected-badge"><i /> {website.status === "Connected" ? "Verified" : "Needs setup"}</span></div><div className="tracking-id-card"><span>Tracking ID</span><strong>{website.trackingId}</strong><button className="copy-button" type="button" onClick={() => void navigator.clipboard?.writeText(website.trackingId)}>Copy</button></div><div className="install-step"><span>1</span><div><h3>Copy this script</h3><p>Add it before the closing <code>&lt;/head&gt;</code> tag on every page.</p><pre>{snippet}</pre><button className="button" onClick={() => void navigator.clipboard?.writeText(snippet)} type="button">Copy script</button></div></div><div className="install-step"><span>2</span><div><h3>Verify your connection</h3><p>{verifyMessage}</p><button className="button button-dark" onClick={verify} type="button">Check connection</button></div></div></div>;
}

function TeamPanel() {
  return <div className="settings-panel"><div className="settings-panel-heading"><div><p className="eyebrow">Organization</p><h2>Team access</h2></div><button className="button button-dark" type="button">＋ Invite member</button></div><div className="team-row"><span className="avatar">MJ</span><div><strong>Mohd Jawed</strong><span>Owner · jawed@example.com</span></div><b>Owner</b></div><div className="team-row"><span className="avatar avatar-muted">AM</span><div><strong>Analytics marketing</strong><span>Viewer access · Invite pending</span></div><b>Pending</b></div><div className="role-note"><span>ⓘ</span><p>Team roles and permissions will control access to visitor data, reports, and billing.</p></div></div>;
}

function BillingPanel({ website }: Readonly<{ website: WebsiteSettings }>) {
  return <div className="settings-panel"><div className="settings-panel-heading"><div><p className="eyebrow">Subscription</p><h2>Manage your plan</h2></div><span className="plan-badge">{website.plan} plan</span></div><div className="plan-card"><div><strong>Growth</strong><p>For teams ready to turn behaviour into revenue.</p></div><b>$99 <small>/ month</small></b></div><div className="usage-row"><div><span>Monthly events</span><strong>{website.eventsThisMonth} / 100,000</strong></div><div className="usage-track"><i style={{ width: "31%" }} /></div></div><div className="settings-actions"><button className="button button-dark" type="button">Manage subscription</button><button className="button" type="button">View invoices</button></div></div>;
}
