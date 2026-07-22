import type { AttendanceRecord } from "@prisma/client";
import { CAMP_END, CAMP_START, dateOnly } from "@/lib/camp";

const VALID_SESSIONS = new Set(["MORNING", "AFTERNOON"]);

function ymd(date: Date | string) {
  return dateOnly(date).toISOString().slice(0, 10);
}

function eachCampDate() {
  const dates: string[] = [];
  const current = dateOnly(CAMP_START);
  const end = dateOnly(CAMP_END);
  while (current.getTime() <= end.getTime()) {
    dates.push(ymd(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

export function validAttendanceDates() {
  return eachCampDate().filter((date) => new Date(`${date}T00:00:00.000Z`).getUTCDay() !== 6);
}

export function totalPossibleAttendanceSessions() {
  return validAttendanceDates().length * 2;
}

export function attendancePercentageStats(records: Pick<AttendanceRecord, "campDate" | "session">[]) {
  const validDates = new Set(validAttendanceDates());
  const attendedSessions = new Set<string>();
  const attendedDays = new Set<string>();

  for (const record of records) {
    const date = ymd(record.campDate);
    if (!validDates.has(date) || !VALID_SESSIONS.has(record.session)) continue;
    attendedSessions.add(`${date}-${record.session}`);
    attendedDays.add(date);
  }

  const totalPossibleSessions = totalPossibleAttendanceSessions();
  const totalSessionsAttended = attendedSessions.size;
  const attendancePercent = totalPossibleSessions
    ? Math.round((totalSessionsAttended / totalPossibleSessions) * 100)
    : 0;

  return {
    attendancePercent,
    attendedDays: attendedDays.size,
    totalSessionsAttended,
    totalPossibleSessions
  };
}
