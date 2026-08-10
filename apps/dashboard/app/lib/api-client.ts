export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, { ...options, headers: { "Content-Type": "application/json", ...options?.headers }, cache: "no-store" });
  } catch {
    throw new ApiError("The API is unavailable. Check that the API service is running.");
  }

  if (!response.ok) {
    let message = `API request failed with status ${response.status}.`;
    try {
      const payload = await response.json() as { error?: string };
      const messages: Record<string, string> = {
        EMAIL_ALREADY_REGISTERED: "An account with this email already exists.",
        INVALID_CREDENTIALS: "The email or password is incorrect.",
        VALIDATION_ERROR: "Please check the information you entered.",
        INVALID_REFRESH_TOKEN: "Your session has expired. Please sign in again.",
        INVALID_PASSWORD_RESET_TOKEN: "That reset link is invalid or has expired. Request a new one.",
        PASSWORD_RESET_FAILED: "We could not reset your password. Please try again.",
        PLATFORM_ADMIN_ACCESS_DENIED: "This account does not have platform administrator access.",
        INVALID_DOMAIN: "Enter a domain such as example.com without a page path.",
        DOMAIN_MISMATCH: "The verification domain does not match this website.",
        WEBSITE_CREATE_FAILED: "Could not create the website. Please try again.",
        VERIFICATION_RATE_LIMITED: "Too many verification attempts. Please wait and try again.",
      };
      if (payload.error && messages[payload.error]) message = messages[payload.error];
    } catch { /* Keep the status-based fallback for non-JSON responses. */ }
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function authenticatedRequest<T>(path: string, accessToken: string, options?: RequestInit) {
  return apiRequest<T>(path, { ...options, headers: { Authorization: `Bearer ${accessToken}`, ...options?.headers } });
}

export type ApiHealth = { service: string; status: "ok"; timestamp: string };

export function getApiHealth() {
  return apiRequest<ApiHealth>("/health");
}

export function getAnalytics<T>(resource: string, query?: Record<string, string>) {
  const search = query ? `?${new URLSearchParams(query).toString()}` : "";
  return apiRequest<T>(`/api/v1/analytics/${resource}${search}`);
}

export function getAuthenticatedAnalytics<T>(resource: string, accessToken: string, query: Record<string, string>) {
  const search = `?${new URLSearchParams(query).toString()}`;
  return authenticatedRequest<T>(`/api/v1/analytics/${resource}${search}`, accessToken);
}

export type LiveTracking = { live: { activeVisitors: number; recentEvents: Array<{ eventId: string; eventType: string; occurredAt: string; path: string }>; lastUpdatedAt: string; activityWindowSeconds: number } };

export function getLiveTracking(accessToken: string, query: { organizationId: string; websiteId: string; limit?: number; windowSeconds?: number }) {
  const search = new URLSearchParams({ organizationId: query.organizationId, websiteId: query.websiteId, limit: String(query.limit ?? 25), windowSeconds: String(query.windowSeconds ?? 300) });
  return authenticatedRequest<LiveTracking>(`/api/v1/analytics/live?${search.toString()}`, accessToken);
}
export type LiveVisitor = { anonymousLabel: string; currentPath: string | null; lastActivity: "page_view" | "navigation" | "click" | "form_start" | "form_error" | "form_submit" | "scroll" | "conversion" | "heartbeat"; lastSeenAt: string; sessionCount: number; eventCount: number; device: string | null; browser: string | null; source: string | null };
export function getLiveVisitors(accessToken: string, query: { organizationId: string; websiteId: string; limit?: number; windowSeconds?: number }) {
  const search = new URLSearchParams({ organizationId: query.organizationId, websiteId: query.websiteId, ...(query.limit ? { limit: String(query.limit) } : {}), ...(query.windowSeconds ? { windowSeconds: String(query.windowSeconds) } : {}) });
  return authenticatedRequest<{ visitors: LiveVisitor[]; activeVisitors: number; lastUpdatedAt: string; activityWindowSeconds: number; pagination: { limit: number; offset: number; hasMore: boolean } }>(`/api/v1/analytics/live/visitors?${search.toString()}`, accessToken);
}
export type LiveVisitorActivity = { type: LiveVisitor["lastActivity"]; occurredAt: string; path: string | null; label: string | null };
export function getLiveVisitorTimeline(accessToken: string, query: { organizationId: string; websiteId: string; visitorLabel: string; limit?: number; windowSeconds?: number }) {
  const search = new URLSearchParams({ organizationId: query.organizationId, websiteId: query.websiteId, ...(query.limit ? { limit: String(query.limit) } : {}), ...(query.windowSeconds ? { windowSeconds: String(query.windowSeconds) } : {}) });
  return authenticatedRequest<{ visitor: { anonymousLabel: string }; timeline: LiveVisitorActivity[]; lastUpdatedAt: string; activityWindowSeconds: number; pagination: { limit: number; offset: number; hasMore: boolean } }>(`/api/v1/analytics/live/visitors/${encodeURIComponent(query.visitorLabel)}/timeline?${search.toString()}`, accessToken);
}

export type AnalyticsRange = { days: number; label: string };

export function postAnalytics<T>(resource: string, body: unknown) {
  return apiRequest<T>(`/api/v1/analytics/${resource}`, { method: "POST", body: JSON.stringify(body) });
}

export type AuthUser = { id: string; name: string | null; email: string; avatar: string | null; provider: string | null; emailVerifiedAt: string | null };
export type AuthTokens = { accessToken: string; refreshToken: string; expiresIn: string };
export type Organization = { id: string; name: string; slug: string; plan: string; status: string; role: "OWNER" | "ADMIN" | "DEVELOPER" | "MARKETING" | "VIEWER"; createdAt: string; updatedAt: string };
export type ApiWebsite = { id: string; organizationId: string; name: string; domain: string; trackingId: string; timezone: string; currency: string; industry: string | null; status: "ACTIVE" | "PAUSED" | "ARCHIVED"; installationStatus: "NOT_INSTALLED" | "INSTALLED" | "VERIFIED"; trackingVerifiedAt: string | null; firstEventAt: string | null; lastEventAt: string | null; createdAt: string; updatedAt: string };

export type AuthResponse = { user: AuthUser; tokens: AuthTokens };
export type PasswordResetResponse = { message: string; resetToken?: string; resetUrl?: string };
export type ApiKey = { id: string; name: string; keyPrefix: string; lastUsedAt: string | null; revokedAt: string | null; createdAt: string };
export type PrivacyRequest = { id: string; type: "EXPORT" | "DELETE"; status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"; createdAt: string; completedAt: string | null };
export type AuditLog = { id: string; action: string; entityType: string; entityId: string | null; metadata: unknown; createdAt: string };
export type AlertEndpoint = { id: string; name: string; status: "ACTIVE" | "PAUSED"; lastDeliveryAt: string | null; lastDeliveryStatus: "PENDING" | "SENT" | "FAILED" | null; createdAt: string };
export type AlertPreference = { websiteId: string; enabled: boolean; minimumPriority: "HIGH" | "MEDIUM" | "LOW" };
export type AdminOverview = { range: { from: string; to: string }; users: { total: number; active: number; new: number }; organizations: { total: number; active: number; free: number; paid: number; new: number }; websites: { total: number }; events: { total: number } };
export type AdminCustomer = { id: string; name: string; slug: string; plan: string; status: string; createdAt: string; updatedAt: string; owner: { id: string; name: string | null; email: string }; memberCount: number; websiteCount: number; lastActivityAt: string | null };
export type AdminCustomerDetail = { id: string; name: string; slug: string; plan: string; status: string; createdAt: string; updatedAt: string; owner: { id: string; name: string | null; email: string; createdAt: string }; members: Array<{ id: string; role: string; createdAt: string; user: { id: string; name: string | null; email: string; createdAt: string } }>; websites: Array<{ id: string; name: string; domain: string; trackingId: string; status: string; installationStatus: string; createdAt: string; lastEventAt: string | null }>; usage: { events: number; lastActivityAt: string | null } };
export type AdminUsage = { range: { from: string; to: string }; daily: Array<{ day: string; events: number; visitors: number; sessions: number; warning: boolean }>; organizations: Array<{ organization_id: string; organization_name: string; plan: string; events: number; visitors: number; sessions: number }>; apiActivity: Array<{ day: string; audit_events: number }>; storage: { trackingEventsBytes: number }; thresholds: { dailyEventLimit: number; dailyEventWarningAt: number; eventRetentionDays: number } };
export type AdminBilling = { statusCounts: Array<{ status: string; count: number }>; subscriptions: Array<{ id: string; provider: string; plan: string; status: string; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean; organization: { id: string; name: string; owner: { email: string } } }>; recentEvents: Array<{ id: string; provider: string; providerEventId: string; eventType: string; status: string; receivedAt: string; processedAt: string | null }> };

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function requestPasswordReset(email: string) {
  return apiRequest<PasswordResetResponse>("/api/v1/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
}

export function resetPassword(token: string, password: string) {
  return apiRequest<{ message: string }>("/api/v1/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
}

export function register(name: string, email: string, password: string) {
  return apiRequest<AuthResponse>("/api/v1/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
}

export function refreshSession(refreshToken: string) {
  return apiRequest<AuthResponse>("/api/v1/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken }) });
}

export function logout(refreshToken: string) {
  return apiRequest<void>("/api/v1/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) });
}

export function getCurrentUser(accessToken: string) {
  return authenticatedRequest<{ user: AuthUser }>("/api/v1/auth/me", accessToken);
}

export function getAdminAccess(accessToken: string) {
  return authenticatedRequest<{ admin: { userId: string; access: "platform" } }>("/api/v1/admin/access", accessToken);
}

export function getAdminOverview(accessToken: string, query?: { from?: string; to?: string }) {
  const search = query ? `?${new URLSearchParams(query).toString()}` : "";
  return authenticatedRequest<{ overview: AdminOverview }>(`/api/v1/admin/overview${search}`, accessToken);
}

export function getAdminCustomers(accessToken: string, query: { q?: string; plan?: string; status?: string; page?: number; limit?: number }) {
  const search = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => { if (value !== undefined && value !== "") search.set(key, String(value)); });
  return authenticatedRequest<{ customers: AdminCustomer[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/api/v1/admin/customers?${search.toString()}`, accessToken);
}

export function getAdminCustomer(accessToken: string, organizationId: string) {
  return authenticatedRequest<{ customer: AdminCustomerDetail }>(`/api/v1/admin/customers/${organizationId}`, accessToken);
}

export function updateAdminCustomerStatus(accessToken: string, organizationId: string, status: "ACTIVE" | "SUSPENDED", reason: string) {
  return authenticatedRequest<{ organization: { id: string; name: string; status: string; updatedAt: string } }>(`/api/v1/admin/customers/${organizationId}/status`, accessToken, { method: "PATCH", body: JSON.stringify({ status, reason }) });
}

export function getAdminUsage(accessToken: string, query?: { organizationId?: string; from?: string; to?: string }) {
  const search = query ? `?${new URLSearchParams(query).toString()}` : "";
  return authenticatedRequest<{ usage: AdminUsage }>(`/api/v1/admin/usage${search}`, accessToken);
}

export type FunnelInput = { name: string; description: string; goal: { type: "conversion" | "form_submit" | "purchase" | "custom"; value?: string }; steps: Array<{ name: string; path: string; type?: "page_view" | "click" | "form_submit" | "custom"; value?: string }> };
export function createFunnel(accessToken: string, organizationId: string, websiteId: string, input: FunnelInput) { return authenticatedRequest<{ funnel: unknown }>(`/api/v1/organizations/${organizationId}/websites/${websiteId}/funnels`, accessToken, { method: "POST", body: JSON.stringify(input) }); }
export function updateFunnel(accessToken: string, organizationId: string, websiteId: string, funnelId: string, input: FunnelInput) { return authenticatedRequest<{ funnel: unknown }>(`/api/v1/organizations/${organizationId}/websites/${websiteId}/funnels/${funnelId}`, accessToken, { method: "PATCH", body: JSON.stringify(input) }); }
export function archiveFunnel(accessToken: string, organizationId: string, websiteId: string, funnelId: string) { return authenticatedRequest<{ funnel: unknown }>(`/api/v1/organizations/${organizationId}/websites/${websiteId}/funnels/${funnelId}`, accessToken, { method: "DELETE" }); }
export function duplicateFunnel(accessToken: string, organizationId: string, websiteId: string, funnelId: string) { return authenticatedRequest<{ funnel: unknown }>(`/api/v1/organizations/${organizationId}/websites/${websiteId}/funnels/${funnelId}/duplicate`, accessToken, { method: "POST" }); }
export function updateInsightStatus(accessToken: string, organizationId: string, websiteId: string, insightId: string, status: "OPEN" | "SAVED" | "DISMISSED" | "RESOLVED") { return authenticatedRequest<{ insight: { id: string; status: string } }>(`/api/v1/organizations/${organizationId}/websites/${websiteId}/insights/${insightId}/status`, accessToken, { method: "PATCH", body: JSON.stringify({ status }) }); }
export function updateInsightAssignment(accessToken: string, organizationId: string, websiteId: string, insightId: string, assignedToId: "self" | null) { return authenticatedRequest<{ insight: { id: string; assignedToId: string | null } }>(`/api/v1/organizations/${organizationId}/websites/${websiteId}/insights/${insightId}/assignment`, accessToken, { method: "PATCH", body: JSON.stringify({ assignedToId }) }); }

export type ExperimentStatus = "PLANNED" | "RUNNING" | "COMPLETED" | "ARCHIVED";
export type Experiment = { id: string; name: string; hypothesis: string; targetPage: string; variant: string; primaryMetric: string; status: ExperimentStatus; baselineValue: string | null; resultValue: string | null; notes: string | null; ownerId: string | null; insightId: string | null; startedAt: string | null; endedAt: string | null; createdAt: string; updatedAt: string; insight: { id: string; title: string; page: string; expectedImprovement: string } | null };
export type ExperimentInput = Omit<Pick<Experiment, "name" | "hypothesis" | "targetPage" | "variant" | "primaryMetric" | "status" | "baselineValue" | "resultValue" | "notes" | "insightId" | "ownerId">, "status"> & { status?: ExperimentStatus };
export function getExperiments(accessToken: string, organizationId: string, websiteId: string) { return authenticatedRequest<{ experiments: Experiment[] }>(`/api/v1/organizations/${organizationId}/websites/${websiteId}/experiments`, accessToken); }
export function createExperiment(accessToken: string, organizationId: string, websiteId: string, input: ExperimentInput) { return authenticatedRequest<{ experiment: Experiment }>(`/api/v1/organizations/${organizationId}/websites/${websiteId}/experiments`, accessToken, { method: "POST", body: JSON.stringify(input) }); }
export function updateExperiment(accessToken: string, organizationId: string, websiteId: string, experimentId: string, input: Partial<ExperimentInput>) { return authenticatedRequest<{ experiment: Experiment }>(`/api/v1/organizations/${organizationId}/websites/${websiteId}/experiments/${experimentId}`, accessToken, { method: "PATCH", body: JSON.stringify(input) }); }
export function archiveExperiment(accessToken: string, organizationId: string, websiteId: string, experimentId: string) { return authenticatedRequest<{ experiment: Pick<Experiment, "id" | "status" | "endedAt"> }>(`/api/v1/organizations/${organizationId}/websites/${websiteId}/experiments/${experimentId}`, accessToken, { method: "DELETE" }); }

export function getAdminBilling(accessToken: string) {
  return authenticatedRequest<{ billing: AdminBilling }>("/api/v1/admin/billing", accessToken);
}

export function getOrganizations(accessToken: string) {
  return authenticatedRequest<{ organizations: Organization[] }>("/api/v1/organizations", accessToken);
}

export function getAlertSettings(accessToken: string, organizationId: string, websiteId: string) {
  return authenticatedRequest<{ endpoints: AlertEndpoint[]; preference: AlertPreference | null }>(`/api/v1/organizations/${organizationId}/alerts?websiteId=${encodeURIComponent(websiteId)}`, accessToken);
}
export function createAlertWebhook(accessToken: string, organizationId: string, name: string, url: string) { return authenticatedRequest<{ endpoint: AlertEndpoint }>(`/api/v1/organizations/${organizationId}/alerts/webhooks`, accessToken, { method: "POST", body: JSON.stringify({ name, url }) }); }
export function deleteAlertWebhook(accessToken: string, organizationId: string, endpointId: string) { return authenticatedRequest<void>(`/api/v1/organizations/${organizationId}/alerts/webhooks/${endpointId}`, accessToken, { method: "DELETE" }); }
export function testAlertWebhook(accessToken: string, organizationId: string, endpointId: string) { return authenticatedRequest<{ delivery: { status: string; responseCode: number | null; error: string | null } }>(`/api/v1/organizations/${organizationId}/alerts/webhooks/${endpointId}/test`, accessToken, { method: "POST" }); }
export function updateAlertPreference(accessToken: string, organizationId: string, websiteId: string, input: Pick<AlertPreference, "enabled" | "minimumPriority">) { return authenticatedRequest<{ preference: AlertPreference }>(`/api/v1/organizations/${organizationId}/alerts/preferences`, accessToken, { method: "PATCH", body: JSON.stringify({ websiteId, ...input }) }); }
export function dispatchAlerts(accessToken: string, organizationId: string, websiteId: string) { return authenticatedRequest<{ dispatched: number; endpoints: number; insights: number }>(`/api/v1/organizations/${organizationId}/alerts/dispatch`, accessToken, { method: "POST", body: JSON.stringify({ websiteId }) }); }

export function getWebsites(accessToken: string, organizationId: string) {
  return authenticatedRequest<{ websites: ApiWebsite[] }>(`/api/v1/organizations/${organizationId}/websites`, accessToken);
}

export function createWebsite(accessToken: string, organizationId: string, input: Pick<ApiWebsite, "name" | "domain" | "timezone" | "currency" | "industry">) {
  return authenticatedRequest<{ website: ApiWebsite }>(`/api/v1/organizations/${organizationId}/websites`, accessToken, { method: "POST", body: JSON.stringify(input) });
}

export function updateWebsite(accessToken: string, organizationId: string, websiteId: string, input: Partial<Pick<ApiWebsite, "name" | "domain" | "timezone" | "currency" | "industry">>) {
  return authenticatedRequest<{ website: ApiWebsite }>(`/api/v1/organizations/${organizationId}/websites/${websiteId}`, accessToken, { method: "PATCH", body: JSON.stringify(input) });
}

export function getTrackingScript(accessToken: string, organizationId: string, websiteId: string) {
  return authenticatedRequest<{ tracking: { trackingId: string; scriptUrl: string; websiteStatus: ApiWebsite["status"]; installationStatus: ApiWebsite["installationStatus"]; verifiedAt: string | null; firstEventAt: string | null; snippet: string } }>(`/api/v1/organizations/${organizationId}/websites/${websiteId}/tracking-script`, accessToken);
}

export type TrackingHealth = { status: "HEALTHY" | "NEEDS_ATTENTION" | "NO_DATA" | "PAUSED" | "ARCHIVED"; message: string; firstEventAt: string | null; lastEventAt: string | null; lastEventAgeSeconds: number | null; sdkVersion: string | null; eventVolume24h: number; uniqueVisitors24h: number; sessions24h: number; eventTypes24h: Array<{ type: string; events: number }>; warnings: string[]; checkedAt: string };
export function getTrackingHealth(accessToken: string, organizationId: string, websiteId: string) {
  return authenticatedRequest<{ health: TrackingHealth }>(`/api/v1/organizations/${organizationId}/websites/${websiteId}/tracking-health`, accessToken);
}

export function verifyTracking(accessToken: string, organizationId: string, websiteId: string, domain?: string) {
  return authenticatedRequest<{ verified: boolean; status: string; installationStatus: ApiWebsite["installationStatus"]; firstEventAt?: string | null; message?: string }>(`/api/v1/organizations/${organizationId}/websites/${websiteId}/verify`, accessToken, { method: "POST", body: JSON.stringify(domain ? { domain } : {}) });
}

export function getApiKeys(accessToken: string, organizationId: string) { return authenticatedRequest<{ apiKeys: ApiKey[] }>(`/api/v1/organizations/${organizationId}/api-keys`, accessToken); }
export function createApiKey(accessToken: string, organizationId: string, name: string) { return authenticatedRequest<{ apiKey: ApiKey; secret: string; warning: string }>(`/api/v1/organizations/${organizationId}/api-keys`, accessToken, { method: "POST", body: JSON.stringify({ name }) }); }
export function revokeApiKey(accessToken: string, organizationId: string, apiKeyId: string) { return authenticatedRequest<void>(`/api/v1/organizations/${organizationId}/api-keys/${apiKeyId}`, accessToken, { method: "DELETE" }); }
export function getAuditLogs(accessToken: string, organizationId: string) { return authenticatedRequest<{ auditLogs: AuditLog[] }>(`/api/v1/organizations/${organizationId}/audit-logs`, accessToken); }
export function exportOrganizationData(accessToken: string, organizationId: string) { return authenticatedRequest<{ exportedAt: string; data: unknown }>(`/api/v1/privacy/export?organizationId=${encodeURIComponent(organizationId)}`, accessToken); }
export function getPrivacyRequests(accessToken: string, organizationId: string) { return authenticatedRequest<{ requests: PrivacyRequest[] }>(`/api/v1/privacy/requests?organizationId=${encodeURIComponent(organizationId)}`, accessToken); }
export function createPrivacyRequest(accessToken: string, organizationId: string, type: "EXPORT" | "DELETE") { return authenticatedRequest<{ request: PrivacyRequest }>("/api/v1/privacy/requests", accessToken, { method: "POST", body: JSON.stringify({ organizationId, type }) }); }
