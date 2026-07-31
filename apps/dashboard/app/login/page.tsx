"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useAccount } from "../lib/account-context";

export default function LoginPage() {
  const { login } = useAccount();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setIsSubmitting(true);
    try { await login(email, password); window.location.href = "/"; } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Could not sign in."); } finally { setIsSubmitting(false); }
  }

  return <main className="onboarding-page"><div className="onboarding-brand"><span className="brand-mark">✦</span><strong>AI Growth</strong></div><form className="onboarding-card" onSubmit={handleSubmit}><p className="eyebrow">Workspace access</p><h1>Welcome back.</h1><p className="onboarding-lead">Sign in to connect the dashboard to your live conversion workspace.</p><label className="onboarding-label">Email<input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label className="onboarding-label">Password<input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-dark onboarding-next" disabled={isSubmitting} type="submit">{isSubmitting ? "Signing in…" : "Sign in"}</button><p className="onboarding-footnote">New to AI Growth? <Link href="/register">Create an account</Link></p><p className="onboarding-footnote"><Link href="/">Return to dashboard</Link></p></form></main>;
}
