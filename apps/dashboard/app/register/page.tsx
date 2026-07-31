"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useAccount } from "../lib/account-context";

export default function RegisterPage() {
  const { register } = useAccount();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      window.location.href = "/onboarding";
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create your account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return <main className="onboarding-page"><div className="onboarding-brand"><span className="brand-mark">✦</span><strong>AI Growth</strong></div><form className="onboarding-card" onSubmit={handleSubmit}><p className="eyebrow">Start growing</p><h1>Create your workspace.</h1><p className="onboarding-lead">Create an account to understand visitor behaviour and improve website conversions.</p><label className="onboarding-label">Full name<input autoComplete="name" minLength={2} maxLength={80} type="text" value={name} onChange={(event) => setName(event.target.value)} required /></label><label className="onboarding-label">Email<input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label className="onboarding-label">Password<input autoComplete="new-password" minLength={8} maxLength={128} type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /><small className="field-help">Use at least 8 characters.</small></label><label className="onboarding-label">Confirm password<input autoComplete="new-password" minLength={8} maxLength={128} type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-dark onboarding-next" disabled={isSubmitting} type="submit">{isSubmitting ? "Creating workspace…" : "Create account"}</button><p className="onboarding-footnote">Already have an account? <Link href="/login">Sign in</Link></p></form></main>;
}
