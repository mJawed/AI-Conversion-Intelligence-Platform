"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell, EmptyState, PageHeader } from "../components/dashboard-shell";
import { Button, ErrorState, LoadingState } from "../components/ui";
import { useAccount, useMockData } from "../lib/account-context";
import { getAdminAccess, getAdminBilling, getAdminCustomer, getAdminCustomers, getAdminOverview, getAdminUsage, updateAdminCustomerStatus, type AdminBilling, type AdminCustomer, type AdminCustomerDetail, type AdminOverview, type AdminUsage } from "../lib/api-client";

const numberFormat = new Intl.NumberFormat("en-US");
const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

function formatNumber(value: number) { return numberFormat.format(Number(value) || 0); }
function formatDate(value: string | null) { return value ? dateFormat.format(new Date(value)) : "No activity"; }
function formatBytes(value: number) { if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`; return `${(value / (1024 * 1024)).toFixed(2)} MB`; }

function Metric({ label, value, detail }: Readonly<{ label: string; value: string; detail: string }>) {
  return <article className="admin-metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

export default function AdminPage() {
  const account = useAccount();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [usage, setUsage] = useState<AdminUsage | null>(null);
  const [billing, setBilling] = useState<AdminBilling | null>(null);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomerDetail | null>(null);
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCustomersLoading, setIsCustomersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);

  const accessToken = account.tokens?.accessToken;

  async function loadAdminData(token: string) {
    setIsLoading(true); setError(null);
    try {
      await getAdminAccess(token);
      const [overviewResponse, usageResponse, billingResponse] = await Promise.all([getAdminOverview(token), getAdminUsage(token), getAdminBilling(token)]);
      setOverview(overviewResponse.overview); setUsage(usageResponse.usage); setBilling(billingResponse.billing); setIsAdmin(true);
    } catch (requestError) {
      setIsAdmin(false); setError(requestError instanceof Error ? requestError.message : "Could not load the admin console.");
    } finally { setIsLoading(false); }
  }

  async function loadCustomers(token: string) {
    setIsCustomersLoading(true); setCustomerError(null);
    try {
      const result = await getAdminCustomers(token, { q: query, plan, status, page, limit: 10 });
      setCustomers(result.customers); setTotalPages(result.pagination.totalPages || 1);
    } catch (requestError) { setCustomerError(requestError instanceof Error ? requestError.message : "Could not load customers."); }
    finally { setIsCustomersLoading(false); }
  }

  useEffect(() => { if (useMockData || !accessToken) { setIsLoading(false); return; } void loadAdminData(accessToken); }, [accessToken, useMockData]);
  useEffect(() => { if (useMockData || !accessToken || !isAdmin) return; void loadCustomers(accessToken); }, [accessToken, isAdmin, page, plan, query, status, useMockData]);

  async function selectCustomer(customer: AdminCustomer) {
    if (!accessToken) return;
    setSelectedCustomer(null); setCustomerError(null);
    try { setSelectedCustomer((await getAdminCustomer(accessToken, customer.id)).customer); }
    catch (requestError) { setCustomerError(requestError instanceof Error ? requestError.message : "Could not load customer details."); }
  }

  async function updateCustomerStatus(status: "ACTIVE" | "SUSPENDED") {
    if (!accessToken || !selectedCustomer || actionReason.trim().length < 5) { setCustomerError("Enter a reason with at least 5 characters before changing status."); return; }
    setIsActionLoading(true); setCustomerError(null);
    try { await updateAdminCustomerStatus(accessToken, selectedCustomer.id, status, actionReason); setActionReason(""); setSelectedCustomer({ ...selectedCustomer, status }); await loadCustomers(accessToken); }
    catch (requestError) { setCustomerError(requestError instanceof Error ? requestError.message : "Could not update customer status."); }
    finally { setIsActionLoading(false); }
  }

  const dailyMax = useMemo(() => usage?.daily.reduce((max, row) => Math.max(max, Number(row.events)), 0) ?? 0, [usage]);
  if (useMockData) return <DashboardShell activeHref="/admin"><PageHeader eyebrow="Platform administration" title="Admin console" /><EmptyState title="Live admin data is disabled" description="Set NEXT_PUBLIC_USE_MOCK_DATA=false and sign in with a platform-admin account to use this console." /></DashboardShell>;
  if (isLoading) return <DashboardShell activeHref="/admin"><PageHeader eyebrow="Platform administration" title="Admin console" /><LoadingState /></DashboardShell>;
  if (!isAdmin) return <DashboardShell activeHref="/admin"><PageHeader eyebrow="Platform administration" title="Admin console" /><ErrorState message={error ?? "Platform administrator access is required."} /></DashboardShell>;

  return <DashboardShell activeHref="/admin"><PageHeader eyebrow="Platform administration" title="Run the customer base." action={<Button onClick={() => accessToken && void loadAdminData(accessToken)}>Refresh data</Button>} />
    <div className="admin-intro"><p>Monitor customers, usage, and free-tier capacity from one protected workspace.</p><span className="admin-security-badge">Platform admin</span></div>
    {error && <ErrorState message={error} onRetry={() => accessToken && void loadAdminData(accessToken)} />}
    {overview && <section className="admin-metrics"><Metric label="Users" value={formatNumber(overview.users.total)} detail={`${formatNumber(overview.users.active)} active · ${formatNumber(overview.users.new)} new`} /><Metric label="Organizations" value={formatNumber(overview.organizations.total)} detail={`${formatNumber(overview.organizations.active)} active · ${formatNumber(overview.organizations.new)} new`} /><Metric label="Free customers" value={formatNumber(overview.organizations.free)} detail="Current organization plan" /><Metric label="Paid customers" value={formatNumber(overview.organizations.paid)} detail="Server plan field" /><Metric label="Websites" value={formatNumber(overview.websites.total)} detail="Connected properties" /><Metric label="Events" value={formatNumber(overview.events.total)} detail="Selected reporting period" /></section>}
    <div className="admin-grid"><section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">Usage</p><h2>Daily platform activity</h2></div>{usage && <span className="admin-panel-meta">Peak {formatNumber(dailyMax)} events</span>}</div>{usage?.daily.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Day</th><th>Events</th><th>Visitors</th><th>Sessions</th><th>Status</th></tr></thead><tbody>{usage.daily.map((row) => <tr key={row.day}><td>{row.day}</td><td>{formatNumber(row.events)}</td><td>{formatNumber(row.visitors)}</td><td>{formatNumber(row.sessions)}</td><td><span className={row.warning ? "admin-warning" : "admin-ok"}>{row.warning ? "Near limit" : "Within limit"}</span></td></tr>)}</tbody></table></div> : <p className="admin-empty">No tracking activity in this period.</p>}<div className="admin-usage-footer"><span>Tracking storage: {formatBytes(usage?.storage.trackingEventsBytes ?? 0)}</span><span>Daily limit: {formatNumber(usage?.thresholds.dailyEventLimit ?? 0)}</span><span>Retention: {usage?.thresholds.eventRetentionDays ?? 0} days</span></div></section><section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">Operations</p><h2>Recorded activity</h2></div></div>{usage?.apiActivity.length ? <div className="admin-activity-list">{usage.apiActivity.slice(-8).reverse().map((row) => <div className="admin-activity-row" key={row.day}><span>{row.day}</span><strong>{formatNumber(row.audit_events)}</strong><small>audit events</small></div>)}</div> : <p className="admin-empty">No audit activity in this period.</p>}</section></div>
    {billing && <section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">Billing</p><h2>Subscription health</h2></div><span className="admin-panel-meta">Provider-confirmed status</span></div><div className="admin-detail-grid">{billing.statusCounts.map((item) => <div key={item.status}><strong>{formatNumber(item.count)}</strong><span>{item.status.toLowerCase()} subscriptions</span></div>)}</div>{billing.subscriptions.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Organization</th><th>Plan</th><th>Status</th><th>Provider</th><th>Period end</th></tr></thead><tbody>{billing.subscriptions.slice(0, 8).map((subscription) => <tr key={subscription.id}><td><strong>{subscription.organization.name}</strong><small>{subscription.organization.owner.email}</small></td><td>{subscription.plan}</td><td><span className={subscription.status === "ACTIVE" || subscription.status === "TRIALING" ? "admin-ok" : "admin-warning"}>{subscription.status}</span></td><td>{subscription.provider}</td><td>{formatDate(subscription.currentPeriodEnd)}</td></tr>)}</tbody></table></div> : <p className="admin-empty">No provider subscriptions have been received yet.</p>}<div className="admin-usage-footer"><span>{billing.recentEvents.length} billing events received</span><span>Signed and idempotent webhook ingestion</span></div></section>}
    <section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">Customers</p><h2>Customer directory</h2></div><span className="admin-panel-meta">Search and inspect accounts</span></div><div className="admin-filters"><input aria-label="Search customers" placeholder="Search email, organization, or domain" value={query} onChange={(event) => { setPage(1); setQuery(event.target.value); }} /><select aria-label="Filter by plan" value={plan} onChange={(event) => { setPage(1); setPlan(event.target.value); }}><option value="">All plans</option><option value="FREE">Free</option><option value="PAID">Paid</option></select><select aria-label="Filter by status" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="ARCHIVED">Archived</option></select></div>{customerError && <p className="form-error" role="alert">{customerError}</p>}{isCustomersLoading ? <LoadingState /> : customers.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Organization</th><th>Owner</th><th>Plan</th><th>Members</th><th>Websites</th><th>Last activity</th></tr></thead><tbody>{customers.map((customer) => <tr className="admin-customer-row" key={customer.id} onClick={() => void selectCustomer(customer)}><td><strong>{customer.name}</strong><small>{customer.slug}</small></td><td>{customer.owner.email}</td><td><span className={customer.plan === "FREE" ? "admin-plan-free" : "admin-plan-paid"}>{customer.plan}</span></td><td>{customer.memberCount}</td><td>{customer.websiteCount}</td><td>{formatDate(customer.lastActivityAt)}</td></tr>)}</tbody></table></div> : <p className="admin-empty">No customers match these filters.</p>}<div className="admin-pagination"><button className="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} type="button">Previous</button><span>Page {page} of {totalPages}</span><button className="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} type="button">Next</button></div></section>
    {selectedCustomer && <section className="admin-panel admin-detail-panel"><div className="admin-panel-heading"><div><p className="eyebrow">Customer detail</p><h2>{selectedCustomer.name}</h2><span>{selectedCustomer.owner.email}</span></div><button className="button" onClick={() => setSelectedCustomer(null)} type="button">Close</button></div><div className="admin-detail-grid"><div><strong>Plan</strong><span>{selectedCustomer.plan} · {selectedCustomer.status}</span></div><div><strong>Members</strong><span>{selectedCustomer.members.length}</span></div><div><strong>Websites</strong><span>{selectedCustomer.websites.length}</span></div><div><strong>Events</strong><span>{formatNumber(selectedCustomer.usage.events)}</span></div></div><div className="admin-action-row"><input aria-label="Status change reason" placeholder="Reason for status change" value={actionReason} onChange={(event) => setActionReason(event.target.value)} /><button className="button" disabled={isActionLoading || selectedCustomer.status === "ACTIVE"} onClick={() => void updateCustomerStatus("ACTIVE")} type="button">Reactivate</button><button className="button button-dark" disabled={isActionLoading || selectedCustomer.status === "SUSPENDED"} onClick={() => void updateCustomerStatus("SUSPENDED")} type="button">Suspend</button></div><h3>Websites</h3><div className="admin-website-list">{selectedCustomer.websites.map((website) => <div key={website.id}><strong>{website.name}</strong><span>{website.domain} · {website.installationStatus}</span></div>)}</div></section>}
  </DashboardShell>;
}
