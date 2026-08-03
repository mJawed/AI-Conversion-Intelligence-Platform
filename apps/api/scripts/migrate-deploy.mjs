import { spawnSync } from "node:child_process";

const maxAttempts = 5;
const retryDelayMs = 5000;
const prismaCommand = process.platform === "win32" ? "npx.cmd" : "npx";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  const result = spawnSync(prismaCommand, ["prisma", "migrate", "deploy", "--schema", "../../prisma/schema.prisma"], {
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status === 0) process.exit(0);

  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const retryable = /P1002|advisory lock|timed out/i.test(output);
  if (!retryable || attempt === maxAttempts) process.exit(result.status ?? 1);

  console.warn(`Prisma migration lock is busy; retrying in ${retryDelayMs / 1000}s (${attempt}/${maxAttempts - 1})`);
  await wait(retryDelayMs);
}
