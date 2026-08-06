-- CreateEnum
CREATE TYPE "AlertEndpointStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "AlertDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "alert_preferences" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "website_id" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "minimum_priority" TEXT NOT NULL DEFAULT 'HIGH',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "alert_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "webhook_endpoints" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "encrypted_url" TEXT NOT NULL,
    "status" "AlertEndpointStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_delivery_at" TIMESTAMP(3),
    "last_delivery_status" "AlertDeliveryStatus",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "alert_deliveries" (
    "id" UUID NOT NULL,
    "endpoint_id" UUID NOT NULL,
    "insight_id" UUID NOT NULL,
    "status" "AlertDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "response_code" INTEGER,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "alert_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "alert_preferences_organization_id_website_id_key" ON "alert_preferences"("organization_id", "website_id");
CREATE INDEX "alert_preferences_website_id_enabled_idx" ON "alert_preferences"("website_id", "enabled");
CREATE UNIQUE INDEX "webhook_endpoints_organization_id_name_key" ON "webhook_endpoints"("organization_id", "name");
CREATE INDEX "webhook_endpoints_organization_id_status_idx" ON "webhook_endpoints"("organization_id", "status");
CREATE UNIQUE INDEX "alert_deliveries_endpoint_id_insight_id_key" ON "alert_deliveries"("endpoint_id", "insight_id");
CREATE INDEX "alert_deliveries_endpoint_id_status_created_at_idx" ON "alert_deliveries"("endpoint_id", "status", "created_at");

ALTER TABLE "alert_preferences" ADD CONSTRAINT "alert_preferences_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "alert_preferences" ADD CONSTRAINT "alert_preferences_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "alert_deliveries" ADD CONSTRAINT "alert_deliveries_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "alert_deliveries" ADD CONSTRAINT "alert_deliveries_insight_id_fkey" FOREIGN KEY ("insight_id") REFERENCES "insights"("id") ON DELETE CASCADE ON UPDATE CASCADE;
