import { DashboardShell, EmptyState, PageHeader } from "./components/dashboard-shell";
import { Button } from "./components/ui";
import { overviewMetrics } from "./data/mock";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <PageHeader action={<Button>＋ Add website</Button>} />

      <div className="notice">
        <div><strong>Connect your first website</strong><p>Install the tracking SDK to turn visitor behaviour into actionable insights.</p></div>
        <Button variant="dark">Get tracking code →</Button>
      </div>

      <div className="section-heading">
        <div><p className="eyebrow">Overview</p><h2>Your growth signals</h2></div>
        <button className="date-pill" type="button">Last 30 days <span aria-hidden="true">▾</span></button>
      </div>

      <div className="metrics">
        {overviewMetrics.map((metric) => (
          <article className="metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.detail}</p>
          </article>
        ))}
      </div>

      <EmptyState
        title="Your dashboard will come alive here"
        description="Once data starts flowing, you’ll see visitor behaviour, funnel drop-offs, form friction, and AI-powered recommendations in one place."
        action={<Button variant="dark">Explore setup →</Button>}
      />
    </DashboardShell>
  );
}
