-- CreateEnum
CREATE TYPE "TrackingInstallationStatus" AS ENUM ('NOT_INSTALLED', 'INSTALLED', 'VERIFIED');

-- AlterTable
ALTER TABLE "websites" ADD COLUMN     "first_event_at" TIMESTAMP(3),
ADD COLUMN     "installation_status" "TrackingInstallationStatus" NOT NULL DEFAULT 'NOT_INSTALLED',
ADD COLUMN     "last_event_at" TIMESTAMP(3),
ADD COLUMN     "tracking_verified_at" TIMESTAMP(3);
