"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { requestPasswordReset } from "../lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setMessage(null); setResetUrl(null); setIsSubmitting(true);
    try {
      const result = await requestPasswordReset(email);
      setMessage(result.message);
      if (result.resetUrl) setResetUrl(result.resetUrl);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Could not request a password reset."); }
    finally { setIsSubmitting(false); }
  }

  return <main className="onboarding-page"><div className="onboarding-brand"><span className="brand-mark">✦</span><strong>AI Growth</strong></div><form className="onboarding-card" onSubmit={handleSubmit}><p className="eyebrow">Account recovery</p><h1>Reset your password.</h1><p className="onboarding-lead">Enter your account email and we’ll send instructions if an account exists.</p><label className="onboarding-label">Email<input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success" role="status">{message}</p>}{resetUrl && <p className="onboarding-footnote">Local development link: <Link href={resetUrl}>Open reset page</Link></p>}<button className="button button-dark onboarding-next" disabled={isSubmitting} type="submit">{isSubmitting ? "Sending…" : "Send reset instructions"}</button><p className="onboarding-footnote"><Link href="/login">Back to sign in</Link></p></form></main>;
}
