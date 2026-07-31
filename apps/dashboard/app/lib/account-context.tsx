"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, createWebsite as createWebsiteRequest, type ApiWebsite, type AuthTokens, type AuthUser, type Organization, getCurrentUser, getOrganizations, getWebsites, login as loginRequest, logout as logoutRequest, refreshSession, register as registerRequest, updateWebsite } from "./api-client";

const accessTokenKey = "ai-growth.access-token";
const refreshTokenKey = "ai-growth.refresh-token";
export const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";

type AccountContextValue = {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  organizations: Organization[];
  selectedOrganization: Organization | null;
  websites: ApiWebsite[];
  selectedWebsite: ApiWebsite | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  createWebsite: (input: Pick<ApiWebsite, "name" | "domain" | "timezone" | "currency" | "industry">) => Promise<ApiWebsite>;
  logout: () => Promise<void>;
  retry: () => void;
  selectOrganization: (organizationId: string) => void;
  selectWebsite: (websiteId: string) => void;
  updateSelectedWebsite: (input: Parameters<typeof updateWebsite>[3]) => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | null>(null);

function saveTokens(tokens: AuthTokens) {
  window.localStorage.setItem(accessTokenKey, tokens.accessToken);
  window.localStorage.setItem(refreshTokenKey, tokens.refreshToken);
}

function readTokens(): AuthTokens | null {
  const accessToken = window.localStorage.getItem(accessTokenKey);
  const refreshToken = window.localStorage.getItem(refreshTokenKey);
  return accessToken && refreshToken ? { accessToken, refreshToken, expiresIn: "15m" } : null;
}

function clearTokens() {
  window.localStorage.removeItem(accessTokenKey);
  window.localStorage.removeItem(refreshTokenKey);
}

export function AccountProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [websites, setWebsites] = useState<ApiWebsite[]>([]);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!useMockData);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const selectedOrganization = organizations.find((organization) => organization.id === selectedOrganizationId) ?? organizations[0] ?? null;
  const selectedWebsite = websites.find((website) => website.id === selectedWebsiteId) ?? websites[0] ?? null;

  useEffect(() => {
    if (useMockData) return;
    let cancelled = false;
    async function loadAccount() {
      setIsLoading(true);
      setError(null);
      let activeTokens = readTokens();
      if (!activeTokens) {
        setIsLoading(false);
        setError("Sign in to connect your live workspace.");
        return;
      }
      try {
        let currentUser;
        try {
          currentUser = await getCurrentUser(activeTokens.accessToken);
        } catch (requestError) {
          if (!(requestError instanceof ApiError) || requestError.status !== 401) throw requestError;
          activeTokens = (await refreshSession(activeTokens.refreshToken)).tokens;
          saveTokens(activeTokens);
          currentUser = await getCurrentUser(activeTokens.accessToken);
        }
        const organizationResponse = await getOrganizations(activeTokens.accessToken);
        if (cancelled) return;
        setTokens(activeTokens);
        setUser(currentUser.user);
        setOrganizations(organizationResponse.organizations);
        const storedOrganizationId = window.localStorage.getItem("ai-growth.organization-id");
        setSelectedOrganizationId(organizationResponse.organizations.some((item) => item.id === storedOrganizationId) ? storedOrganizationId : organizationResponse.organizations[0]?.id ?? null);
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Could not load your workspace.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void loadAccount();
    return () => { cancelled = true; };
  }, [retryKey]);

  useEffect(() => {
    if (useMockData || !tokens?.accessToken || !selectedOrganization) return;
    let cancelled = false;
    setIsLoading(true);
    getWebsites(tokens.accessToken, selectedOrganization.id).then((result) => {
      if (!cancelled) {
        setWebsites(result.websites);
        const storedWebsiteId = window.localStorage.getItem("ai-growth.website-id");
        setSelectedWebsiteId(result.websites.some((item) => item.id === storedWebsiteId) ? storedWebsiteId : result.websites[0]?.id ?? null);
      }
    }).catch((requestError) => {
      if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Could not load websites.");
    }).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedOrganization, tokens]);

  const value = useMemo<AccountContextValue>(() => ({
    user,
    tokens,
    organizations,
    selectedOrganization,
    websites,
    selectedWebsite,
    isLoading,
    error,
    async login(email, password) {
      const result = await loginRequest(email, password);
      saveTokens(result.tokens);
      setTokens(result.tokens);
      setUser(result.user);
      setRetryKey((key) => key + 1);
    },
    async register(name, email, password) {
      const result = await registerRequest(name, email, password);
      saveTokens(result.tokens);
      setTokens(result.tokens);
      setUser(result.user);
      setRetryKey((key) => key + 1);
    },
    async createWebsite(input) {
      if (!tokens?.accessToken || !selectedOrganization) throw new Error("Sign in before creating a website.");
      const result = await createWebsiteRequest(tokens.accessToken, selectedOrganization.id, input);
      setWebsites((current) => [...current, result.website]);
      setSelectedWebsiteId(result.website.id);
      window.localStorage.setItem("ai-growth.website-id", result.website.id);
      return result.website;
    },
    async logout() {
      if (tokens?.refreshToken) await logoutRequest(tokens.refreshToken).catch(() => undefined);
      clearTokens();
      setUser(null); setTokens(null); setOrganizations([]); setWebsites([]); setSelectedOrganizationId(null); setSelectedWebsiteId(null);
    },
    retry: () => setRetryKey((key) => key + 1),
    selectOrganization(organizationId) {
      window.localStorage.setItem("ai-growth.organization-id", organizationId);
      setSelectedOrganizationId(organizationId);
      setSelectedWebsiteId(null);
    },
    selectWebsite(websiteId) {
      window.localStorage.setItem("ai-growth.website-id", websiteId);
      setSelectedWebsiteId(websiteId);
    },
    async updateSelectedWebsite(input) {
      if (!tokens?.accessToken || !selectedOrganization || !selectedWebsite) throw new Error("No live website is selected.");
      const result = await updateWebsite(tokens.accessToken, selectedOrganization.id, selectedWebsite.id, input);
      setWebsites((current) => current.map((website) => website.id === result.website.id ? result.website : website));
    },
  }), [user, tokens, organizations, selectedOrganization, websites, selectedWebsite, isLoading, error]);

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) throw new Error("useAccount must be used within AccountProvider");
  return context;
}
