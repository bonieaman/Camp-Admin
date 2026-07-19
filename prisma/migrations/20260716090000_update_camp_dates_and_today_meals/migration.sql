-- Update the official camp schedule to July 15-25, 2026.
UPDATE "Setting"
SET
  "startDate" = '2026-07-15T00:00:00.000Z',
  "endDate" = '2026-07-25T00:00:00.000Z',
  "finalRequiredDate" = '2026-07-25T00:00:00.000Z',
  "totalDays" = 11,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'camp';

-- Correct today's accidentally recorded Lunch meal entries to Breakfast only.
UPDATE "MealRecord"
SET "meal" = 'BREAKFAST'
WHERE "campDate" = '2026-07-16T00:00:00.000Z'
  AND "meal" = 'LUNCH';
