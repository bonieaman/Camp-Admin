-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL DEFAULT 'camp',
    "campName" TEXT NOT NULL DEFAULT 'Youth Camp 2026',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDays" INTEGER NOT NULL DEFAULT 11,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Addis_Ababa',
    "participantIdPrefix" TEXT NOT NULL DEFAULT 'YC-2026',
    "finalRequiredDate" TIMESTAMP(3) NOT NULL,
    "finalRequiredSession" TEXT NOT NULL DEFAULT 'AFTERNOON',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "fatherName" TEXT,
    "age" INTEGER,
    "gender" TEXT,
    "phone" TEXT,
    "church" TEXT,
    "registrationStatus" TEXT NOT NULL DEFAULT 'Registered',
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" TIMESTAMP(3),
    "disciplinaryClearance" BOOLEAN NOT NULL DEFAULT true,
    "qrToken" TEXT NOT NULL,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "campDate" TIMESTAMP(3) NOT NULL,
    "campDay" INTEGER NOT NULL,
    "session" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'QR_SCAN',

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealRecord" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "campDate" TIMESTAMP(3) NOT NULL,
    "campDay" INTEGER NOT NULL,
    "meal" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'QR_SCAN',

    CONSTRAINT "MealRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachRecord" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "campDate" TIMESTAMP(3) NOT NULL,
    "campDay" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'AFTERNOON_ATTENDANCE',

    CONSTRAINT "OutreachRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeRecord" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "campDate" TIMESTAMP(3) NOT NULL,
    "campDay" INTEGER NOT NULL,
    "challenge" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_participantId_key" ON "Participant"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_qrToken_key" ON "Participant"("qrToken");

-- CreateIndex
CREATE INDEX "Participant_fullName_idx" ON "Participant"("fullName");

-- CreateIndex
CREATE INDEX "Participant_fatherName_idx" ON "Participant"("fatherName");

-- CreateIndex
CREATE INDEX "Participant_phone_idx" ON "Participant"("phone");

-- CreateIndex
CREATE INDEX "Participant_church_idx" ON "Participant"("church");

-- CreateIndex
CREATE INDEX "Participant_checkedIn_idx" ON "Participant"("checkedIn");

-- CreateIndex
CREATE INDEX "AttendanceRecord_campDate_session_idx" ON "AttendanceRecord"("campDate", "session");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_participantId_campDate_session_key" ON "AttendanceRecord"("participantId", "campDate", "session");

-- CreateIndex
CREATE INDEX "MealRecord_campDate_meal_idx" ON "MealRecord"("campDate", "meal");

-- CreateIndex
CREATE UNIQUE INDEX "MealRecord_participantId_campDate_meal_key" ON "MealRecord"("participantId", "campDate", "meal");

-- CreateIndex
CREATE INDEX "OutreachRecord_campDate_idx" ON "OutreachRecord"("campDate");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachRecord_participantId_campDate_key" ON "OutreachRecord"("participantId", "campDate");

-- CreateIndex
CREATE INDEX "ChallengeRecord_campDate_idx" ON "ChallengeRecord"("campDate");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeRecord_participantId_campDate_challenge_key" ON "ChallengeRecord"("participantId", "campDate", "challenge");

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealRecord" ADD CONSTRAINT "MealRecord_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachRecord" ADD CONSTRAINT "OutreachRecord_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeRecord" ADD CONSTRAINT "ChallengeRecord_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
