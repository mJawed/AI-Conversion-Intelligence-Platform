import { DashboardShell, PageHeader } from "../components/dashboard-shell";
import { Button } from "../components/ui";
import { websiteSettings } from "../data/mock";
import { SettingsView } from "./settings-view";

export default function SettingsPage() {
  return <DashboardShell activeHref="/settings"><PageHeader eyebrow="Workspace settings" title="Make the platform yours." action={<Button>Save all changes</Button>} /><div className="page-intro"><p>Manage your website connection, team access, and subscription.</p><span className="date-pill">Acme website ▾</span></div><SettingsView website={websiteSettings} /></DashboardShell>;
}
