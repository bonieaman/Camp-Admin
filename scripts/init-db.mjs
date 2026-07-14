import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const dbPath = join(process.cwd(), "prisma", "dev.db");
mkdirSync(dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);

const statements = [
  `CREATE TABLE IF NOT EXISTS Setting (
    id TEXT PRIMARY KEY NOT NULL,
    campName TEXT NOT NULL DEFAULT 'Youth Camp 2026',
    startDate DATETIME NOT NULL,
    endDate DATETIME NOT NULL,
    totalDays INTEGER NOT NULL DEFAULT 11,
    timezone TEXT NOT NULL DEFAULT 'Africa/Addis_Ababa',
    participantIdPrefix TEXT NOT NULL DEFAULT 'YC-2026',
    finalRequiredDate DATETIME NOT NULL,
    finalRequiredSession TEXT NOT NULL DEFAULT 'AFTERNOON',
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS Team (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS Participant (
    id TEXT PRIMARY KEY NOT NULL,
    participantId TEXT NOT NULL UNIQUE,
    fullName TEXT NOT NULL,
    fatherName TEXT,
    age INTEGER,
    gender TEXT,
    phone TEXT,
    church TEXT,
    registrationStatus TEXT NOT NULL DEFAULT 'Registered',
    checkedIn BOOLEAN NOT NULL DEFAULT false,
    checkedInAt DATETIME,
    disciplinaryClearance BOOLEAN NOT NULL DEFAULT true,
    qrToken TEXT NOT NULL UNIQUE,
    teamId TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teamId) REFERENCES Team(id) ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS AttendanceRecord (
    id TEXT PRIMARY KEY NOT NULL,
    participantId TEXT NOT NULL,
    campDate DATETIME NOT NULL,
    campDay INTEGER NOT NULL,
    session TEXT NOT NULL,
    scannedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    source TEXT NOT NULL DEFAULT 'QR_SCAN',
    FOREIGN KEY (participantId) REFERENCES Participant(id) ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS MealRecord (
    id TEXT PRIMARY KEY NOT NULL,
    participantId TEXT NOT NULL,
    campDate DATETIME NOT NULL,
    campDay INTEGER NOT NULL,
    meal TEXT NOT NULL,
    scannedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    source TEXT NOT NULL DEFAULT 'QR_SCAN',
    FOREIGN KEY (participantId) REFERENCES Participant(id) ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS OutreachRecord (
    id TEXT PRIMARY KEY NOT NULL,
    participantId TEXT NOT NULL,
    campDate DATETIME NOT NULL,
    campDay INTEGER NOT NULL,
    completedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    source TEXT NOT NULL DEFAULT 'AFTERNOON_ATTENDANCE',
    FOREIGN KEY (participantId) REFERENCES Participant(id) ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS ChallengeRecord (
    id TEXT PRIMARY KEY NOT NULL,
    participantId TEXT NOT NULL,
    campDate DATETIME NOT NULL,
    campDay INTEGER NOT NULL,
    challenge TEXT NOT NULL,
    completedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participantId) REFERENCES Participant(id) ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS AttendanceRecord_participantId_campDate_session_key ON AttendanceRecord(participantId, campDate, session)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS MealRecord_participantId_campDate_meal_key ON MealRecord(participantId, campDate, meal)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS OutreachRecord_participantId_campDate_key ON OutreachRecord(participantId, campDate)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS ChallengeRecord_participantId_campDate_challenge_key ON ChallengeRecord(participantId, campDate, challenge)`,
  `CREATE INDEX IF NOT EXISTS Participant_fullName_idx ON Participant(fullName)`,
  `CREATE INDEX IF NOT EXISTS Participant_phone_idx ON Participant(phone)`,
  `CREATE INDEX IF NOT EXISTS Participant_church_idx ON Participant(church)`,
  `CREATE INDEX IF NOT EXISTS Participant_checkedIn_idx ON Participant(checkedIn)`,
  `CREATE INDEX IF NOT EXISTS AttendanceRecord_campDate_session_idx ON AttendanceRecord(campDate, session)`,
  `CREATE INDEX IF NOT EXISTS MealRecord_campDate_meal_idx ON MealRecord(campDate, meal)`,
  `CREATE INDEX IF NOT EXISTS OutreachRecord_campDate_idx ON OutreachRecord(campDate)`,
  `CREATE INDEX IF NOT EXISTS ChallengeRecord_campDate_idx ON ChallengeRecord(campDate)`
];

for (const statement of statements) db.exec(statement);

const columns = db.prepare(`PRAGMA table_info(Participant)`).all().map((column) => column.name);
if (!columns.includes("fatherName")) db.exec(`ALTER TABLE Participant ADD COLUMN fatherName TEXT`);
if (!columns.includes("checkedInAt")) db.exec(`ALTER TABLE Participant ADD COLUMN checkedInAt DATETIME`);
db.exec(`CREATE INDEX IF NOT EXISTS Participant_fatherName_idx ON Participant(fatherName)`);

db.prepare(`INSERT OR IGNORE INTO Setting (id, startDate, endDate, finalRequiredDate) VALUES ('camp', '2026-07-08T00:00:00.000Z', '2026-07-18T00:00:00.000Z', '2026-07-18T00:00:00.000Z')`).run();
db.prepare(`INSERT OR IGNORE INTO Team (id, name) VALUES ('unassigned', 'Unassigned')`).run();
db.close();
console.log(`Initialized ${dbPath}`);
