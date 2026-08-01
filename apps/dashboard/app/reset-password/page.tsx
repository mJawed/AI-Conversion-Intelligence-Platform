"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { resetPassword } from "../lib/api-client";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { setToken(new URLSearchParams(window.location.search).get("token") ?? ""); }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setMessage(null);
    if (!token) { setError("This reset link is missing its token."); return; }
    if (password !== confirmation) { setError("Passwords do not match."); return; }
    setIsSubmitting(true);
    try { const result = await resetPassword(token, password); setMessage(result.message); setPassword(""); setConfirmation(""); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Could not reset your password."); }
    finally { setIsSubmitting(false); }
  }

  return <main className="onboarding-page"><div className="onboarding-brand"><span className="brand-mark">✦</span><strong>AI Growth</strong></div><form className="onboarding-card" onSubmit={handleSubmit}><p className="eyebrow">Account recovery</p><h1>Choose a new password.</h1><p className="onboarding-lead">Use at least 8 characters. Your existing sessions will be signed out.</p><label className="onboarding-label">New password<input autoComplete="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></label><label className="onboarding-label">Confirm password<input autoComplete="new-password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} required /></label>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success" role="status">{message} <Link href="/login">Sign in</Link></p>}<button className="button button-dark onboarding-next" disabled={isSubmitting || Boolean(message)} type="submit">{isSubmitting ? "Resetting…" : "Reset password"}</button><p className="onboarding-footnote"><Link href="/forgot-password">Request a new link</Link></p></form></main>;
}
