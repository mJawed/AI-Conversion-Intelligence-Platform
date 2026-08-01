import dotenv from "dotenv";
import { PrivacyRequestStatus, PrivacyRequestType } from "@prisma/client";
import { prisma } from "./lib/prisma";

dotenv.config();
dotenv.config({ path: "../../.env" });

async function processRequest(requestId?: string) {
  const request = await prisma.privacyRequest.findFirst({ where: { status: PrivacyRequestStatus.PROCESSING, ...(requestId ? { id: requestId } : {}) }, select: { id: true, type: true, organizationId: true } });
  if (!request) return false;
  await prisma.$transaction(async (transaction) => {
    if (request.type === PrivacyRequestType.DELETE) {
      await transaction.trackingEvent.deleteMany({ where: { website: { organizationId: request.organizationId } } });
      await transaction.privacyConsent.deleteMany({ where: { website: { organizationId: request.organizationId } } });
      await transaction.insight.deleteMany({ where: { organizationId: request.organizationId } });
      await transaction.funnel.deleteMany({ where: { organizationId: request.organizationId } });
    }
    await transaction.privacyRequest.update({ where: { id: request.id }, data: { status: PrivacyRequestStatus.COMPLETED, completedAt: new Date() } });
    await transaction.auditLog.create({ data: { organizationId: request.organizationId, userId: null, action: `privacy.${request.type.toLowerCase()}_completed`, entityType: "privacy_request", entityId: request.id, metadata: { processedBy: "privacy-processor", irreversible: request.type === PrivacyRequestType.DELETE } } });
  });
  console.log(`Completed ${request.type} privacy request ${request.id}.`);
  return true;
}

async function main() {
  const requestId = process.argv[2];
  let processed = 0;
  while (await processRequest(requestId)) { processed += 1; if (requestId) break; }
  console.log(`Processed ${processed} privacy request(s).`);
}

main().catch((error) => { console.error("Privacy request processing failed", error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
