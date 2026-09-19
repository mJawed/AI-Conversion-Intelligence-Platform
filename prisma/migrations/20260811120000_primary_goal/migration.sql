-- Add the configurable primary conversion goal used by tracking health and CRO recommendations.
ALTER TABLE "websites"
ADD COLUMN "primary_goal_name" TEXT,
ADD COLUMN "primary_goal_type" TEXT NOT NULL DEFAULT 'conversion',
ADD COLUMN "primary_goal_value" TEXT;
