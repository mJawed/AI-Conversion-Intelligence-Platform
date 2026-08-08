-- AlterTable
ALTER TABLE "funnel_steps" ADD COLUMN     "event_type" TEXT NOT NULL DEFAULT 'page_view',
ADD COLUMN     "event_value" TEXT;
