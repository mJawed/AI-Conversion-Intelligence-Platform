-- AlterEnum
ALTER TYPE "InsightStatus" ADD VALUE 'SAVED';

-- AlterTable
ALTER TABLE "insights" ADD COLUMN     "assigned_to_id" UUID;
