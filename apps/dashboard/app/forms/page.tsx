import { DashboardShell, PageHeader } from "../components/dashboard-shell";
import { Button } from "../components/ui";
import { forms } from "../data/mock";
import { FormsView } from "./forms-view";

export default function FormsPage() {
  return <DashboardShell activeHref="/forms"><PageHeader eyebrow="Form intelligence" title="Remove conversion friction." action={<Button>＋ Track a form</Button>} /><div className="page-intro"><p>See where visitors hesitate, make fixes with confidence, and improve completion rates.</p><span className="date-pill">Last 30 days ▾</span></div><FormsView forms={forms} /></DashboardShell>;
}
