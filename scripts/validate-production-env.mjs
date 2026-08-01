import process from "node:process";

const freeMvpMode = process.env.FREE_MVP_MODE === "true";
const required = [
  "DATABASE_URL",
  "JWT_SECRET",
  "ENCRYPTION_KEY",
  "CORS_ORIGINS",
];
if (!freeMvpMode) required.push("RABBITMQ_URL", "REDIS_URL", "CLICKHOUSE_URL");
const placeholderPatterns = [
  /^replace-with/i,
  /^your-/i,
  /^change-me$/i,
  /^growth: growth$/i,
  /^postgresql:\/\/growth: growth@/i,
];

const failures = [];
for (const name of required) {
  const value = process.env[name]?.trim();
  if (!value) failures.push(`${name} is missing`);
  else if (placeholderPatterns.some((pattern) => pattern.test(value))) failures.push(`${name} still contains a placeholder`);
}

if (process.env.NODE_ENV !== "production") failures.push("NODE_ENV must be production");
if (!freeMvpMode && process.env.EVENT_PIPELINE_ENABLED !== "true") failures.push("EVENT_PIPELINE_ENABLED must be true");
if (!freeMvpMode && process.env.REDIS_ENABLED !== "true") failures.push("REDIS_ENABLED must be true");
if (!freeMvpMode && process.env.CLICKHOUSE_ENABLED !== "true") failures.push("CLICKHOUSE_ENABLED must be true");
if (freeMvpMode && process.env.ANALYTICS_STORAGE === "clickhouse") failures.push("Free MVP mode must use ANALYTICS_STORAGE=postgres");

const databaseUrl = process.env.DATABASE_URL ?? "";
if (databaseUrl && !/^postgres(?:ql)?:\/\//.test(databaseUrl)) failures.push("DATABASE_URL must use postgresql:// or postgres://");
if (process.env.ENCRYPTION_KEY && !/^[a-f0-9]{64}$/i.test(process.env.ENCRYPTION_KEY)) failures.push("ENCRYPTION_KEY must contain exactly 64 hexadecimal characters");
if ((process.env.CORS_ORIGINS ?? "").split(",").some((origin) => /localhost|127\.0\.0\.1/.test(origin))) failures.push("CORS_ORIGINS must not include localhost in production");

if (failures.length) {
  console.error("Production environment validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Production environment validation passed.");
