-- Production-safe additive migration for RBAC activity audit fields and team-level activity tracking.
-- This migration is intentionally idempotent so existing deployments that already applied
-- the original initial migration can upgrade without server-side dashboard crashes.

ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "recordedBy" TEXT;
ALTER TABLE "MealRecord" ADD COLUMN IF NOT EXISTS "recordedBy" TEXT;
ALTER TABLE "OutreachRecord" ADD COLUMN IF NOT EXISTS "recordedBy" TEXT;
ALTER TABLE "ChallengeRecord" ADD COLUMN IF NOT EXISTS "recordedBy" TEXT;

ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "qrToken" TEXT;

UPDATE "Team"
SET "qrToken" = md5(random()::text || clock_timestamp()::text || "id")
WHERE "qrToken" IS NULL OR "qrToken" = '';

ALTER TABLE "Team" ALTER COLUMN "qrToken" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Team_qrToken_key" ON "Team"("qrToken");

CREATE TABLE IF NOT EXISTS "TeamActivity" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "activityDate" TIMESTAMP(3) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT,

    CONSTRAINT "TeamActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TeamActivity_activityDate_activityType_idx" ON "TeamActivity"("activityDate", "activityType");
CREATE UNIQUE INDEX IF NOT EXISTS "TeamActivity_teamId_activityDate_activityType_key" ON "TeamActivity"("teamId", "activityDate", "activityType");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'TeamActivity_teamId_fkey'
  ) THEN
    ALTER TABLE "TeamActivity"
    ADD CONSTRAINT "TeamActivity_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
