import { DashboardShell, PageHeader } from "../components/dashboard-shell";
import { Button } from "../components/ui";
import { funnels } from "../data/mock";
import { FunnelsView } from "./funnels-view";

export default function FunnelsPage() {
  return <DashboardShell activeHref="/funnels"><PageHeader eyebrow="Funnel analytics" title="Find the conversion leaks." action={<Button>＋ Create funnel</Button>} /><div className="page-intro"><p>See where journeys break down and focus your next optimization on the highest-impact step.</p><span className="date-pill">Last 30 days ▾</span></div><FunnelsView funnels={funnels} /></DashboardShell>;
}
