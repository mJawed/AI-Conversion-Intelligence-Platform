import type { AIInsight, FormAnalytics, FunnelAnalytics, WebsiteSettings } from "../data/mock";
import { aiInsights, forms, funnels, websiteSettings } from "../data/mock";
import { getAnalytics } from "./api-client";

export const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";

export async function getWebsiteSettings(): Promise<WebsiteSettings> {
  return useMockData ? websiteSettings : getAnalytics<WebsiteSettings>("website");
}

export async function getForms(): Promise<FormAnalytics[]> {
  return useMockData ? forms : getAnalytics<FormAnalytics[]>("forms");
}

export async function getFunnels(): Promise<FunnelAnalytics[]> {
  return useMockData ? funnels : getAnalytics<FunnelAnalytics[]>("funnels");
}

export async function getInsights(): Promise<AIInsight[]> {
  return useMockData ? aiInsights : getAnalytics<AIInsight[]>("insights");
}
