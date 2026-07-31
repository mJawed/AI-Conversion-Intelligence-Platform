import Link from "next/link";
import { navigationItems } from "../data/mock";

export function DashboardShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="shell">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="AI Growth overview">
          <span className="brand-mark">✦</span>
          <span>AI Growth</span>
        </Link>

        <nav className="primary-nav" aria-label="Primary navigation">
          {navigationItems.map((item, index) => (
            <Link className={index === 0 ? "nav-item active" : "nav-item"} href={item.href} key={item.label}>
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer"><span className="status-dot" /> Platform foundation ready</div>
      </aside>
      <section className="content">{children}</section>
    </main>
  );
}

export function PageHeader({ action }: Readonly<{ action?: React.ReactNode }>) {
  return (
    <header className="topbar">
      <div><p className="eyebrow">Conversion intelligence</p><h1>Good morning.</h1></div>
      {action}
    </header>
  );
}

export function EmptyState({ title, description, action }: Readonly<{ title: string; description: string; action?: React.ReactNode }>) {
  return (
    <section className="empty-card" aria-live="polite">
      <div className="empty-icon" aria-hidden="true">◌</div>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </section>
  );
}
