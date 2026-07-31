export function Button({ children, variant = "default" }: Readonly<{ children: React.ReactNode; variant?: "default" | "dark" }>) {
  return <button className={variant === "dark" ? "button button-dark" : "button"}>{children}</button>;
}

export function LoadingState() {
  return <div className="state-card"><span className="spinner" aria-hidden="true" /><span>Loading growth signals…</span></div>;
}

export function ErrorState({ message, onRetry }: Readonly<{ message?: string; onRetry?: () => void }>) {
  return <div className="state-card state-error"><strong>We couldn’t load this view.</strong><span>{message ?? "Try again or check your connection."}</span>{onRetry && <button className="button" onClick={onRetry} type="button">Retry</button>}</div>;
}
