import "dotenv/config";
import { prisma } from "./lib/prisma";

const action = process.argv[2];
const email = process.argv[3]?.trim().toLowerCase();

async function main() {
  if (!["grant", "revoke"].includes(action) || !email) {
    console.error("Usage: npm run admin:grant --workspace @ai-growth/api -- user@example.com");
    console.error("   or: npm run admin:revoke --workspace @ai-growth/api -- user@example.com");
    process.exitCode = 1;
    return;
  }
  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
    if (!user) throw new Error(`No user found for ${email}`);
    if (action === "grant") {
      await prisma.platformAdmin.upsert({ where: { userId: user.id }, update: { revokedAt: null }, create: { userId: user.id } });
      console.log(`Platform admin access granted to ${user.email}`);
    } else {
      await prisma.platformAdmin.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
      console.log(`Platform admin access revoked for ${user.email}`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Could not update platform admin access");
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
