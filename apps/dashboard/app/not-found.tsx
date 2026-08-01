export default function NotFound() {
  return (
    <main className="runtime-state" role="status">
      <section className="runtime-card">
        <p className="eyebrow">Page not found</p>
        <h1>That page doesn’t exist.</h1>
        <p>The link may be outdated, or the page may have moved.</p>
        <a className="button button-dark" href="/">Return to overview</a>
      </section>
    </main>
  );
}
