import { DashboardShell, PageHeader } from "../components/dashboard-shell";
import { Button } from "../components/ui";
import { visitors } from "../data/mock";
import { VisitorsView } from "./visitors-view";

export default function VisitorsPage() {
  return <DashboardShell activeHref="/visitors"><PageHeader eyebrow="Visitor analytics" title="Understand every journey." action={<Button>Export report ↓</Button>} /><div className="page-intro"><p>Explore sessions, identify intent, and find the moments that shape conversion.</p><span className="date-pill">Last 30 days ▾</span></div><VisitorsView visitors={visitors} /></DashboardShell>;
}
