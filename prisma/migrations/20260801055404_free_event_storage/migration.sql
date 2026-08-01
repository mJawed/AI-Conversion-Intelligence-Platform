-- CreateTable
CREATE TABLE "tracking_events" (
    "id" UUID NOT NULL,
    "website_id" UUID NOT NULL,
    "event_id" TEXT NOT NULL,
    "tracking_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "visitor_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "referrer" TEXT,
    "title" TEXT,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "context" JSONB NOT NULL DEFAULT '{}',
    "ingested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tracking_events_website_id_occurred_at_idx" ON "tracking_events"("website_id", "occurred_at");

-- CreateIndex
CREATE INDEX "tracking_events_website_id_visitor_id_occurred_at_idx" ON "tracking_events"("website_id", "visitor_id", "occurred_at");

-- CreateIndex
CREATE INDEX "tracking_events_website_id_session_id_occurred_at_idx" ON "tracking_events"("website_id", "session_id", "occurred_at");

-- CreateIndex
CREATE INDEX "tracking_events_website_id_event_type_occurred_at_idx" ON "tracking_events"("website_id", "event_type", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "tracking_events_website_id_event_id_key" ON "tracking_events"("website_id", "event_id");

-- AddForeignKey
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
