type RequestSample = { durationMs: number; status: number };

const startedAt = Date.now();
const samples: RequestSample[] = [];
const maxSamples = 2000;

export function recordRequest(durationMs: number, status: number) {
  samples.push({ durationMs, status });
  if (samples.length > maxSamples) samples.splice(0, samples.length - maxSamples);
}

function percentile(values: number[], percentileValue: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * percentileValue) - 1)];
}

export function getObservabilityMetrics() {
  const durations = samples.map((sample) => sample.durationMs);
  const serverErrors = samples.filter((sample) => sample.status >= 500).length;
  const rateLimited = samples.filter((sample) => sample.status === 429).length;
  return {
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    window: { requests: samples.length, maxSamples },
    responses: { serverErrors, rateLimited, errorRate: samples.length ? Number((serverErrors / samples.length).toFixed(4)) : 0 },
    latencyMs: { p50: percentile(durations, 0.5), p95: percentile(durations, 0.95), max: durations.length ? Math.max(...durations) : 0 },
  };
}
