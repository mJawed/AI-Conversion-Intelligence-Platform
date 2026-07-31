import Link from "next/link";
import { Button } from "../components/ui";
import { websiteSettings } from "../data/mock";

export default function OnboardingPage() {
  return <main className="onboarding-page"><div className="onboarding-brand"><span className="brand-mark">✦</span><strong>AI Growth</strong></div><div className="onboarding-card"><div className="onboarding-progress"><span className="progress-active" /><span /><span /></div><p className="eyebrow">Website setup · Step 1 of 3</p><h1>Connect your first website.</h1><p className="onboarding-lead">Add a website to start seeing visitor behaviour, conversion leaks, and AI recommendations.</p><label className="onboarding-label">Website name<input placeholder="e.g. Acme website" defaultValue={websiteSettings.name} /></label><label className="onboarding-label">Website URL<input placeholder="https://yourwebsite.com" defaultValue={`https://${websiteSettings.domain}`} /></label><Link className="button button-dark onboarding-next" href="/settings">Continue to tracking setup →</Link><p className="onboarding-footnote">You can add more websites after setup.</p></div></main>;
}
