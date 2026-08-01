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

export type AnalyticsRange = { days: number; label: string };

export function postAnalytics<T>(resource: string, body: unknown) {
  return apiRequest<T>(`/api/v1/analytics/${resource}`, { method: "POST", body: JSON.stringify(body) });
}

export type AuthUser = { id: string; name: string | null; email: string; avatar: string | null; provider: string | null; emailVerifiedAt: string | null };
export type AuthTokens = { accessToken: string; refreshToken: string; expiresIn: string };
export type Organization = { id: string; name: string; slug: string; plan: string; status: string; role: "OWNER" | "ADMIN" | "DEVELOPER" | "MARKETING" | "VIEWER"; createdAt: string; updatedAt: string };
export type ApiWebsite = { id: string; organizationId: string; name: string; domain: string; trackingId: string; timezone: string; currency: string; industry: string | null; status: "ACTIVE" | "PAUSED" | "ARCHIVED"; installationStatus: "NOT_INSTALLED" | "INSTALLED" | "VERIFIED"; trackingVerifiedAt: string | null; firstEventAt: string | null; lastEventAt: string | null; createdAt: string; updatedAt: string };

export type AuthResponse = { user: AuthUser; tokens: AuthTokens };
export type ApiKey = { id: string; name: string; keyPrefix: string; lastUsedAt: string | null; revokedAt: string | null; createdAt: string };
export type PrivacyRequest = { id: string; type: "EXPORT" | "DELETE"; status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"; createdAt: string; completedAt: string | null };
export type AuditLog = { id: string; action: string; entityType: string; entityId: string | null; metadata: unknown; createdAt: string };

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
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

export function getOrganizations(accessToken: string) {
  return authenticatedRequest<{ organizations: Organization[] }>("/api/v1/organizations", accessToken);
}

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
