import type { AttendanceRecord } from "@prisma/client";
import { dateOnly } from "@/lib/camp";

const VALID_SESSIONS = new Set(["MORNING", "AFTERNOON"]);
const TOTAL_POSSIBLE_ATTENDANCE_SESSIONS = 16;

function ymd(date: Date | string) {
  return dateOnly(date).toISOString().slice(0, 10);
}

export function totalPossibleAttendanceSessions() {
  return TOTAL_POSSIBLE_ATTENDANCE_SESSIONS;
}

export function attendancePercentageStats(records: Pick<AttendanceRecord, "campDate" | "session">[]) {
  const attendedSessions = new Set<string>();
  const attendedDays = new Set<string>();
  const morningSessions = new Set<string>();
  const afternoonSessions = new Set<string>();

  for (const record of records) {
    const date = ymd(record.campDate);
    if (!VALID_SESSIONS.has(record.session)) continue;
    attendedSessions.add(`${date}-${record.session}`);
    attendedDays.add(date);
    if (record.session === "MORNING") morningSessions.add(date);
    if (record.session === "AFTERNOON") afternoonSessions.add(date);
  }

  const totalPossibleSessions = totalPossibleAttendanceSessions();
  const totalSessionsAttended = attendedSessions.size;
  const attendancePercent = totalPossibleSessions
    ? Math.round((totalSessionsAttended / totalPossibleSessions) * 100)
    : 0;

  return {
    attendancePercent,
    attendedDays: attendedDays.size,
    morningSessions: morningSessions.size,
    afternoonSessions: afternoonSessions.size,
    totalSessionsAttended,
    totalPossibleSessions
  };
}
