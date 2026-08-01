const baseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";
const requests = Number(process.env.LOAD_TEST_REQUESTS ?? 100);
const concurrency = Math.max(1, Number(process.env.LOAD_TEST_CONCURRENCY ?? 10));

if (!Number.isInteger(requests) || requests < 1 || requests > 5000) throw new Error("LOAD_TEST_REQUESTS must be between 1 and 5000");

let next = 0;
const results = [];
async function worker() {
  while (next < requests) {
    const index = next++;
    const started = performance.now();
    try {
      const response = await fetch(`${baseUrl}/health`);
      results[index] = { status: response.status, durationMs: performance.now() - started };
    } catch (error) {
      results[index] = { status: 0, durationMs: performance.now() - started, error: String(error) };
    }
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, requests) }, worker));
const durations = results.map((result) => result.durationMs).sort((left, right) => left - right);
const failures = results.filter((result) => result.status < 200 || result.status >= 300);
const percentile = (value) => durations[Math.min(durations.length - 1, Math.ceil(durations.length * value) - 1)];
console.log(JSON.stringify({ baseUrl, requests, concurrency, failures: failures.length, latencyMs: { p50: Number(percentile(0.5).toFixed(2)), p95: Number(percentile(0.95).toFixed(2)), max: Number(Math.max(...durations).toFixed(2)) } }, null, 2));
if (failures.length) process.exitCode = 1;
