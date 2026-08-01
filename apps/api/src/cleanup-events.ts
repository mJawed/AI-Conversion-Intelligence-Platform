import dotenv from "dotenv";
import { prisma } from "./lib/prisma";
import { getEventRetentionDays } from "./config";

dotenv.config();
dotenv.config({ path: "../../.env" });

async function main() {
  const retentionDays = getEventRetentionDays();
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const result = await prisma.trackingEvent.deleteMany({ where: { occurredAt: { lt: cutoff } } });
  console.log(`Deleted ${result.count} tracking events older than ${retentionDays} days.`);
}

main().catch((error) => {
  console.error("Event cleanup failed", error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
