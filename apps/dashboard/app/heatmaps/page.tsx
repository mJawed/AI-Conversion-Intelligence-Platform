import { DashboardShell, PageHeader } from "../components/dashboard-shell";
import { Button } from "../components/ui";
import { heatmapPoints } from "../data/mock";
import { HeatmapsView } from "./heatmaps-view";

export default function HeatmapsPage() {
  return <DashboardShell activeHref="/heatmaps"><PageHeader eyebrow="Heatmaps" title="See attention in context." action={<Button>Export heatmap ↓</Button>} /><div className="page-intro"><p>Visualize clicks, attention, and dead zones across the pages that matter most.</p><span className="date-pill">Last 30 days ▾</span></div><HeatmapsView points={heatmapPoints} /></DashboardShell>;
}
