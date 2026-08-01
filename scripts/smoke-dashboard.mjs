const baseUrl = (process.env.DASHBOARD_URL || "http://localhost:3000").replace(/\/$/, "");
const routes = ["/", "/login", "/register", "/settings"];

for (const route of routes) {
  const response = await fetch(`${baseUrl}${route}`);
  if (!response.ok) throw new Error(`${route} returned HTTP ${response.status}`);
  console.log(`✓ ${route} (${response.status})`);
}

console.log(`Dashboard smoke check passed: ${routes.length} routes at ${baseUrl}`);
