"use client";

import { useState } from "react";
import type { WebsiteSettings } from "../data/mock";

const tabs = ["Website", "Installation", "Team", "Billing"] as const;

export function SettingsView({ website }: Readonly<{ website: WebsiteSettings }>) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Website");
  return <div className="settings-explorer"><div className="settings-tabs" role="tablist" aria-label="Settings sections">{tabs.map((item) => <button className={item === tab ? "settings-tab active" : "settings-tab"} key={item} onClick={() => setTab(item)} type="button" role="tab" aria-selected={item === tab}>{item}</button>)}</div>{tab === "Website" && <WebsiteSettingsPanel website={website} />}{tab === "Installation" && <InstallationPanel website={website} />}{tab === "Team" && <TeamPanel />}{tab === "Billing" && <BillingPanel website={website} />}</div>;
}

function WebsiteSettingsPanel({ website }: Readonly<{ website: WebsiteSettings }>) {
  return <div className="settings-panel"><div className="settings-panel-heading"><div><p className="eyebrow">Website settings</p><h2>Configure your website</h2></div><span className="connected-badge"><i /> {website.status}</span></div><div className="settings-form"><label>Website name<input defaultValue={website.name} /></label><label>Domain<input defaultValue={website.domain} /></label><label>Industry<select defaultValue={website.industry}><option>SaaS / Technology</option><option>E-commerce</option><option>Professional services</option><option>Media / Publishing</option></select></label><label>Timezone<select defaultValue={website.timezone}><option>Asia/Kolkata</option><option>UTC</option><option>America/New_York</option><option>Europe/London</option></select></label><label>Currency<select defaultValue={website.currency}><option>USD</option><option>INR</option><option>EUR</option><option>GBP</option></select></label></div><div className="settings-actions"><button className="button button-dark" type="button">Save changes</button><button className="button" type="button">Archive website</button></div></div>;
}

function InstallationPanel({ website }: Readonly<{ website: WebsiteSettings }>) {
  return <div className="settings-panel"><div className="settings-panel-heading"><div><p className="eyebrow">Tracking setup</p><h2>Connect {website.domain}</h2></div><span className="connected-badge"><i /> Ready</span></div><div className="tracking-id-card"><span>Tracking ID</span><strong>{website.trackingId}</strong><button className="copy-button" type="button">Copy</button></div><div className="install-step"><span>1</span><div><h3>Copy this script</h3><p>Add it before the closing <code>&lt;/head&gt;</code> tag on every page.</p><pre>{`<script src="https://app.aigrowth.dev/tracker.js"\n  data-tracking-id="${website.trackingId}"></script>`}</pre><button className="button" type="button">Copy script</button></div></div><div className="install-step"><span>2</span><div><h3>Verify your connection</h3><p>Visit your website after installing the script. We’ll detect the first event automatically.</p><button className="button button-dark" type="button">Check connection</button></div></div></div>;
}

function TeamPanel() {
  return <div className="settings-panel"><div className="settings-panel-heading"><div><p className="eyebrow">Organization</p><h2>Team access</h2></div><button className="button button-dark" type="button">＋ Invite member</button></div><div className="team-row"><span className="avatar">MJ</span><div><strong>Mohd Jawed</strong><span>Owner · jawed@example.com</span></div><b>Owner</b></div><div className="team-row"><span className="avatar avatar-muted">AM</span><div><strong>Analytics marketing</strong><span>Viewer access · Invite pending</span></div><b>Pending</b></div><div className="role-note"><span>ⓘ</span><p>Team roles and permissions will control access to visitor data, reports, and billing.</p></div></div>;
}

function BillingPanel({ website }: Readonly<{ website: WebsiteSettings }>) {
  return <div className="settings-panel"><div className="settings-panel-heading"><div><p className="eyebrow">Subscription</p><h2>Manage your plan</h2></div><span className="plan-badge">{website.plan} plan</span></div><div className="plan-card"><div><strong>Growth</strong><p>For teams ready to turn behaviour into revenue.</p></div><b>$99 <small>/ month</small></b></div><div className="usage-row"><div><span>Monthly events</span><strong>{website.eventsThisMonth} / 100,000</strong></div><div className="usage-track"><i style={{ width: "31%" }} /></div></div><div className="settings-actions"><button className="button button-dark" type="button">Manage subscription</button><button className="button" type="button">View invoices</button></div></div>;
}
