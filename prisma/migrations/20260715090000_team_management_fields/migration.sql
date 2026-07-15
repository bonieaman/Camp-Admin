-- Add permanent public team IDs and editable team metadata.
-- Remove placeholder/default teams so teams exist only when a SuperAdmin creates them.

ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "teamCode" TEXT;
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "leader" TEXT;
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "color" TEXT;

UPDATE "Participant"
SET "teamId" = NULL
WHERE "teamId" IN (SELECT "id" FROM "Team" WHERE lower("name") IN ('alpha', 'unassigned'));

DELETE FROM "TeamActivity"
WHERE "teamId" IN (SELECT "id" FROM "Team" WHERE lower("name") IN ('alpha', 'unassigned'));

DELETE FROM "Team" WHERE lower("name") IN ('alpha', 'unassigned');

WITH ordered AS (
  SELECT "id", row_number() OVER (ORDER BY "createdAt", "id") AS rn
  FROM "Team"
  WHERE "teamCode" IS NULL OR "teamCode" = ''
)
UPDATE "Team"
SET "teamCode" = 'YCT-2026-' || lpad(ordered.rn::text, 3, '0')
FROM ordered
WHERE "Team"."id" = ordered."id";

ALTER TABLE "Team" ALTER COLUMN "teamCode" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Team_teamCode_key" ON "Team"("teamCode");

CREATE TABLE IF NOT EXISTS "TeamCounter" (
    "id" TEXT NOT NULL DEFAULT 'team',
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamCounter_pkey" PRIMARY KEY ("id")
);

INSERT INTO "TeamCounter" ("id", "nextNumber", "updatedAt")
VALUES (
  'team',
  COALESCE((SELECT max(substring("teamCode" from '^YCT-2026-(\d+)$')::int) + 1 FROM "Team" WHERE "teamCode" ~ '^YCT-2026-\d+$'), 1),
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE
SET "nextNumber" = GREATEST("TeamCounter"."nextNumber", EXCLUDED."nextNumber"),
    "updatedAt" = CURRENT_TIMESTAMP;
