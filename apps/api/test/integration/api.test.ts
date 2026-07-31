import assert from "node:assert/strict";
import test from "node:test";

const enabled = process.env.RUN_INTEGRATION_TESTS === "true";
const baseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";

test("API health and protected analytics contract", { skip: !enabled }, async () => {
  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200);
  const analytics = await fetch(`${baseUrl}/api/v1/analytics/overview`);
  assert.equal(analytics.status, 401);
});
