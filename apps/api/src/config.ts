export type AnalyticsStorage = "postgres" | "clickhouse";

function positiveInteger(name: string, fallback: number, maximum: number) {
  const value = Number(process.env[name]);
  if (!Number.isInteger(value) || value < 1) return fallback;
  return Math.min(value, maximum);
}

export function isFreeMvpMode() {
  return process.env.FREE_MVP_MODE !== "false";
}

export function getAnalyticsStorage(): AnalyticsStorage {
  return process.env.ANALYTICS_STORAGE === "clickhouse" ? "clickhouse" : "postgres";
}

export function isPostgresEventStorageEnabled() {
  return process.env.POSTGRES_EVENT_STORAGE_ENABLED === "true";
}

export function getEventRetentionDays() {
  return positiveInteger("EVENT_RETENTION_DAYS", 30, 3650);
}

export function getMaxTrackingEventsPerDay() {
  return positiveInteger("MAX_TRACKING_EVENTS_PER_DAY", 100000, 10000000);
}

export function getInfrastructureConfig() {
  return {
    freeMvpMode: isFreeMvpMode(),
    analyticsStorage: getAnalyticsStorage(),
    postgresEventStorageEnabled: isPostgresEventStorageEnabled(),
    eventRetentionDays: getEventRetentionDays(),
    maxTrackingEventsPerDay: getMaxTrackingEventsPerDay(),
  };
}
