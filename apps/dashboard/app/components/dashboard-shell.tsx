import Link from "next/link";
import { navigationItems } from "../data/mock";
import { ApiStatus } from "./api-status";

export function DashboardShell({ children, activeHref = "/" }: Readonly<{ children: React.ReactNode; activeHref?: string }>) {
  return (
    <main className="shell">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="AI Growth overview">
          <span className="brand-mark">✦</span>
          <span>AI Growth</span>
        </Link>

        <nav className="primary-nav" aria-label="Primary navigation">
          {navigationItems.map((item) => (
            <Link className={item.href === activeHref ? "nav-item active" : "nav-item"} href={item.href} key={item.label}>
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

export function PageHeader({ action, title = "Good morning.", eyebrow = "Conversion intelligence" }: Readonly<{ action?: React.ReactNode; title?: string; eyebrow?: string }>) {
  return (
    <header className="topbar">
      <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>
      <div className="topbar-actions"><ApiStatus />{action}</div>
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
