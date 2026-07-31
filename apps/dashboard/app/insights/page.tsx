import { DashboardShell, PageHeader } from "../components/dashboard-shell";
import { Button } from "../components/ui";
import { aiInsights } from "../data/mock";
import { InsightsView } from "./insights-view";

export default function InsightsPage() {
  return <DashboardShell activeHref="/insights"><PageHeader eyebrow="AI insights" title="Know what to fix next." action={<Button>Generate report ✦</Button>} /><div className="page-intro"><p>Evidence-backed CRO recommendations ranked by confidence, impact, and urgency.</p><span className="date-pill">Last 30 days ▾</span></div><InsightsView insights={aiInsights} /></DashboardShell>;
}
