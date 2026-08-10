-- CreateEnum
CREATE TYPE "ExperimentStatus" AS ENUM ('PLANNED', 'RUNNING', 'COMPLETED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "experiments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "website_id" UUID NOT NULL,
    "insight_id" UUID,
    "owner_id" UUID,
    "name" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "target_page" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "primary_metric" TEXT NOT NULL,
    "status" "ExperimentStatus" NOT NULL DEFAULT 'PLANNED',
    "baseline_value" TEXT,
    "result_value" TEXT,
    "notes" TEXT,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "experiments_organization_id_website_id_status_idx" ON "experiments"("organization_id", "website_id", "status");

-- CreateIndex
CREATE INDEX "experiments_website_id_updated_at_idx" ON "experiments"("website_id", "updated_at");

-- AddForeignKey
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_insight_id_fkey" FOREIGN KEY ("insight_id") REFERENCES "insights"("id") ON DELETE SET NULL ON UPDATE CASCADE;
