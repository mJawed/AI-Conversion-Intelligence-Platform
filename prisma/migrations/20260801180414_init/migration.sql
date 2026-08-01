-- CreateTable
CREATE TABLE "privacy_consents" (
    "id" UUID NOT NULL,
    "website_id" UUID NOT NULL,
    "visitor_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "privacy_consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "privacy_consents_website_id_occurred_at_idx" ON "privacy_consents"("website_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "privacy_consents_website_id_visitor_id_key" ON "privacy_consents"("website_id", "visitor_id");

-- AddForeignKey
ALTER TABLE "privacy_consents" ADD CONSTRAINT "privacy_consents_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
