import type { InsightPreview, TopPage, TrendPoint } from "../data/mock";

export function TrafficChart({ points }: Readonly<{ points: TrendPoint[] }>) {
  const max = Math.max(...points.map((point) => point.value), 1);
  const coordinates = points.map((point, index) => {
    const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
    const y = 100 - (point.value / max) * 80 - 10;
    return `${x},${y}`;
  }).join(" ");

  return (
    <section className="widget chart-widget" aria-labelledby="traffic-heading">
      <div className="widget-heading"><div><p className="eyebrow">Traffic</p><h2 id="traffic-heading">Visitor trend</h2></div><span className="legend"><i /> Visitors</span></div>
      <div className="chart-wrap">
        <div className="chart-y-axis"><span>100</span><span>50</span><span>0</span></div>
        <svg className="traffic-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Visitor trend rising over the last 30 days">
          <defs><linearGradient id="traffic-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#9be7b1" stopOpacity=".55" /><stop offset="100%" stopColor="#9be7b1" stopOpacity="0" /></linearGradient></defs>
          <line x1="0" x2="100" y1="25" y2="25" className="chart-grid" /><line x1="0" x2="100" y1="50" y2="50" className="chart-grid" /><line x1="0" x2="100" y1="75" y2="75" className="chart-grid" />
          <polygon points={`0,100 ${coordinates} 100,100`} className="chart-area" />
          {points.length > 0 && <polyline points={coordinates} className="chart-line" />}
        </svg>
      </div>
      <div className="chart-labels">{points.map((point) => <span key={point.label}>{point.label}</span>)}</div>
    </section>
  );
}

export function RealtimeCard({ available = true }: Readonly<{ available?: boolean }>) {
  return (
    <section className="widget realtime-widget" aria-labelledby="realtime-heading">
      <div className="widget-heading"><div><p className="eyebrow">Realtime</p><h2 id="realtime-heading">Active visitors</h2></div><span className="live-label"><i /> Live</span></div>
      <div className="realtime-number">{available ? "37" : "—"} <span>visitors</span></div>
      <div className="realtime-bar"><span style={{ width: available ? "67%" : "0%" }} /></div>
      <div className="realtime-meta"><span>{available ? "67% on mobile" : "Realtime endpoint pending"}</span><span>{available ? "Peak: 52" : ""}</span></div>
      {available && <div className="current-pages"><div><span className="page-dot" /> /pricing <strong>14</strong></div><div><span className="page-dot" /> / <strong>9</strong></div><div><span className="page-dot" /> /features <strong>7</strong></div></div>}
    </section>
  );
}

export function TopPages({ pages }: Readonly<{ pages: TopPage[] }>) {
  return (
    <section className="widget" aria-labelledby="pages-heading">
      <div className="widget-heading"><div><p className="eyebrow">Content</p><h2 id="pages-heading">Top pages</h2></div><a className="text-link" href="/visitors">View all →</a></div>
      <div className="page-list">{pages.map((page) => <div className="page-row" key={page.path}><span className="page-path">{page.path}</span><span className="page-visitors">{page.visitors}<small>{page.share}</small></span></div>)}</div>
    </section>
  );
}

export function InsightPreview({ insights, empty = false }: Readonly<{ insights: InsightPreview[]; empty?: boolean }>) {
  return (
    <section className="widget" aria-labelledby="insights-heading">
      <div className="widget-heading"><div><p className="eyebrow">AI analysis</p><h2 id="insights-heading">Recent insights</h2></div><a className="text-link" href="/insights">View all →</a></div>
      {empty ? <p className="widget-empty">AI insights will appear after analytics signals are available.</p> : <div className="insight-list">{insights.map((insight) => <div className="insight-row" key={insight.title}><span className={`priority priority-${insight.priority.toLowerCase()}`}>{insight.priority}</span><div><strong>{insight.title}</strong><span>{insight.category} · Est. impact {insight.impact}</span></div><span className="insight-arrow">→</span></div>)}</div>}
    </section>
  );
}
