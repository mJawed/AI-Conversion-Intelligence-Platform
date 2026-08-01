-- CreateEnum
CREATE TYPE "InsightStatus" AS ENUM ('OPEN', 'DISMISSED', 'RESOLVED');

-- CreateTable
CREATE TABLE "insights" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "website_id" UUID NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" "InsightStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "confidence" TEXT NOT NULL,
    "business_impact" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "expected_improvement" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "insights_organization_id_status_updated_at_idx" ON "insights"("organization_id", "status", "updated_at");

-- CreateIndex
CREATE INDEX "insights_website_id_category_severity_idx" ON "insights"("website_id", "category", "severity");

-- CreateIndex
CREATE UNIQUE INDEX "insights_website_id_fingerprint_key" ON "insights"("website_id", "fingerprint");

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
