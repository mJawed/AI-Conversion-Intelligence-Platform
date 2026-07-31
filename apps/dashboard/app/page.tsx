import { DashboardShell, PageHeader } from "./components/dashboard-shell";
import { InsightPreview, RealtimeCard, TopPages, TrafficChart } from "./components/overview-widgets";
import { Button } from "./components/ui";
import { insightPreviews, overviewMetrics, topPages, trafficTrend } from "./data/mock";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <PageHeader action={<Button>＋ Add website</Button>} />

      <div className="section-heading">
        <div><p className="eyebrow">Overview</p><h2>Your growth signals</h2></div>
        <div className="filters"><button className="website-pill" type="button"><span className="site-favicon">A</span> Acme website <span aria-hidden="true">▾</span></button><button className="date-pill" type="button">Last 30 days <span aria-hidden="true">▾</span></button></div>
      </div>

      <div className="metrics">
        {overviewMetrics.map((metric) => (
          <article className="metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.detail} <span className={`metric-change ${metric.tone ?? "neutral"}`}>{metric.change}</span></p>
          </article>
        ))}
      </div>

      <div className="overview-grid"><TrafficChart points={trafficTrend} /><RealtimeCard /></div>
      <div className="overview-grid lower-grid"><TopPages pages={topPages} /><InsightPreview insights={insightPreviews} /></div>

      <div className="setup-reminder"><div><strong>Want to connect another website?</strong><p>Install the tracking SDK and start collecting conversion signals.</p></div><Button variant="dark">＋ Add website</Button></div>
    </DashboardShell>
  );
}
