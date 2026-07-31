import net from "node:net";
import process from "node:process";

function tcpCheck(name, rawUrl) {
  return new Promise((resolve) => {
    const url = new URL(rawUrl);
    const socket = net.createConnection({ host: url.hostname, port: Number(url.port) || (url.protocol === "amqp:" ? 5672 : 6379) });
    const timeout = setTimeout(() => { socket.destroy(); resolve(`${name}: unavailable`); }, 5000);
    socket.once("connect", () => { clearTimeout(timeout); socket.end(); resolve(`${name}: reachable`); });
    socket.once("error", () => { clearTimeout(timeout); resolve(`${name}: unavailable`); });
  });
}

async function main() {
  const results = [];
  results.push(await tcpCheck("RabbitMQ", process.env.RABBITMQ_URL ?? "amqp://localhost:5672"));
  results.push(await tcpCheck("Redis", process.env.REDIS_URL ?? "redis://localhost:6379"));

  const clickhouse = new URL(process.env.CLICKHOUSE_URL ?? "http://localhost:8123");
  try {
    const response = await fetch(new URL("/ping", clickhouse), { signal: AbortSignal.timeout(5000) });
    results.push(`ClickHouse: ${response.ok ? "reachable" : "unavailable"}`);
  } catch {
    results.push("ClickHouse: unavailable");
  }

  for (const result of results) console.log(result);
  if (results.some((result) => result.endsWith("unavailable"))) process.exitCode = 1;
}

await main();
