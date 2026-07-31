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
  return response.json() as Promise<T>;
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
