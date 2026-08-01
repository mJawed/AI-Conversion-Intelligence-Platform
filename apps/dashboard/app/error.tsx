"use client";

export default function Error({ reset }: Readonly<{ reset: () => void }>) {
  return (
    <main className="runtime-state" role="alert">
      <section className="runtime-card">
        <p className="eyebrow">Dashboard error</p>
        <h1>We couldn’t load this view.</h1>
        <p>Something unexpected happened. Try again, or return to the overview and continue from there.</p>
        <div className="error-actions">
          <button className="button button-dark" type="button" onClick={() => reset()}>Try again</button>
          <a className="button" href="/">Return to overview</a>
        </div>
      </section>
    </main>
  );
}
