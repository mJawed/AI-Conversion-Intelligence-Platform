-- CreateEnum
CREATE TYPE "FunnelStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "funnels" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "website_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "goal_type" TEXT NOT NULL,
    "goal_value" TEXT,
    "status" "FunnelStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funnels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funnel_steps" (
    "id" UUID NOT NULL,
    "funnel_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funnel_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "funnels_organization_id_status_idx" ON "funnels"("organization_id", "status");

-- CreateIndex
CREATE INDEX "funnels_website_id_status_idx" ON "funnels"("website_id", "status");

-- CreateIndex
CREATE INDEX "funnel_steps_funnel_id_idx" ON "funnel_steps"("funnel_id");

-- CreateIndex
CREATE UNIQUE INDEX "funnel_steps_funnel_id_position_key" ON "funnel_steps"("funnel_id", "position");

-- AddForeignKey
ALTER TABLE "funnels" ADD CONSTRAINT "funnels_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funnels" ADD CONSTRAINT "funnels_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funnel_steps" ADD CONSTRAINT "funnel_steps_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "funnels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
