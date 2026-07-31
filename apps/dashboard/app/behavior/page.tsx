import { DashboardShell, PageHeader } from "../components/dashboard-shell";
import { Button } from "../components/ui";
import { behaviourIssues, clickTargets, scrollPages } from "../data/mock";
import { BehaviourView } from "./behavior-view";

export default function BehaviourPage() {
  return <DashboardShell activeHref="/behavior"><PageHeader eyebrow="Behaviour analytics" title="See where experience breaks." action={<Button>Export behaviour ↓</Button>} /><div className="page-intro"><p>Turn clicks, scrolls, and navigation patterns into clear UX priorities.</p><span className="date-pill">Last 30 days ▾</span></div><BehaviourView clickTargets={clickTargets} issues={behaviourIssues} scrollPages={scrollPages} /></DashboardShell>;
}
