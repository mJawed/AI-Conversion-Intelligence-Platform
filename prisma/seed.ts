import dotenv from "dotenv";
import { PrismaClient, OrganizationRole, WebsiteStatus } from "@prisma/client";

dotenv.config({ path: "../../.env" });

const prisma = new PrismaClient();

async function main() {
  const owner = await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: { name: "Demo Owner" },
    create: { name: "Demo Owner", email: "owner@example.com", provider: "seed" }
  });

  const organization = await prisma.organization.upsert({
    where: { slug: "demo-organization" },
    update: { ownerId: owner.id, name: "Demo Organization" },
    create: { ownerId: owner.id, name: "Demo Organization", slug: "demo-organization" }
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: organization.id, userId: owner.id } },
    update: { role: OrganizationRole.OWNER },
    create: { organizationId: organization.id, userId: owner.id, role: OrganizationRole.OWNER }
  });

  const website = await prisma.website.upsert({
    where: { trackingId: "trk_demo_acme" },
    update: { organizationId: organization.id, name: "Demo website", domain: "demo.example.com", status: WebsiteStatus.ACTIVE },
    create: { organizationId: organization.id, name: "Demo website", domain: "demo.example.com", trackingId: "trk_demo_acme", timezone: "UTC", currency: "USD", industry: "SaaS" }
  });

  console.log(`Seeded ${owner.email}, ${organization.slug}, and ${website.trackingId}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
