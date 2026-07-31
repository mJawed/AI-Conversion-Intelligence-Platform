import fs from "node:fs/promises";
import process from "node:process";

const baseUrl = new URL(process.env.CLICKHOUSE_URL ?? "http://localhost:8123");
const schema = await fs.readFile(new URL("../apps/api/sql/events.sql", import.meta.url), "utf8");
const response = await fetch(baseUrl, { method: "POST", body: schema, signal: AbortSignal.timeout(10000) });

if (!response.ok) {
  console.error(`ClickHouse schema application failed with HTTP ${response.status}`);
  process.exit(1);
}

console.log("ClickHouse events schema applied successfully.");
