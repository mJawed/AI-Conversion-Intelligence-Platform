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

  if (!response.ok) throw new ApiError(`API request failed with status ${response.status}.`, response.status);
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

export function postAnalytics<T>(resource: string, body: unknown) {
  return apiRequest<T>(`/api/v1/analytics/${resource}`, { method: "POST", body: JSON.stringify(body) });
}

export type AuthUser = { id: string; name: string | null; email: string; avatar: string | null; provider: string | null; emailVerifiedAt: string | null };
export type AuthTokens = { accessToken: string; refreshToken: string; expiresIn: string };
export type Organization = { id: string; name: string; slug: string; plan: string; status: string; role: "OWNER" | "ADMIN" | "DEVELOPER" | "MARKETING" | "VIEWER"; createdAt: string; updatedAt: string };
export type ApiWebsite = { id: string; organizationId: string; name: string; domain: string; trackingId: string; timezone: string; currency: string; industry: string | null; status: "ACTIVE" | "PAUSED" | "ARCHIVED"; installationStatus: "NOT_INSTALLED" | "INSTALLED" | "VERIFIED"; trackingVerifiedAt: string | null; firstEventAt: string | null; lastEventAt: string | null; createdAt: string; updatedAt: string };

export type AuthResponse = { user: AuthUser; tokens: AuthTokens };

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
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

export function updateWebsite(accessToken: string, organizationId: string, websiteId: string, input: Partial<Pick<ApiWebsite, "name" | "domain" | "timezone" | "currency" | "industry">>) {
  return authenticatedRequest<{ website: ApiWebsite }>(`/api/v1/organizations/${organizationId}/websites/${websiteId}`, accessToken, { method: "PATCH", body: JSON.stringify(input) });
}

export function getTrackingScript(accessToken: string, organizationId: string, websiteId: string) {
  return authenticatedRequest<{ tracking: { trackingId: string; scriptUrl: string; installationStatus: ApiWebsite["installationStatus"]; verifiedAt: string | null; firstEventAt: string | null; snippet: string } }>(`/api/v1/organizations/${organizationId}/websites/${websiteId}/tracking-script`, accessToken);
}

export function verifyTracking(accessToken: string, organizationId: string, websiteId: string, domain?: string) {
  return authenticatedRequest<{ verified: boolean; status: string; installationStatus: ApiWebsite["installationStatus"]; message?: string }>(`/api/v1/organizations/${organizationId}/websites/${websiteId}/verify`, accessToken, { method: "POST", body: JSON.stringify(domain ? { domain } : {}) });
}
