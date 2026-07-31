import { DashboardShell, PageHeader } from "../components/dashboard-shell";
import { Button } from "../components/ui";
import { replaySessions } from "../data/mock";
import { ReplaysView } from "./replays-view";

export default function ReplaysPage() {
  return <DashboardShell activeHref="/replays"><PageHeader eyebrow="Session replay" title="Watch the moments that matter." action={<Button>Filter sessions ▾</Button>} /><div className="page-intro"><p>Review real journeys, understand friction, and let AI summarize the important moments.</p><span className="date-pill">Last 30 days ▾</span></div><ReplaysView sessions={replaySessions} /></DashboardShell>;
}
