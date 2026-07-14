import type { AttendanceRecord, MealRecord, OutreachRecord, Participant } from "@prisma/client";

type ParticipantWithRecords = Participant & {
  attendanceRecords: AttendanceRecord[];
  mealRecords: MealRecord[];
  outreachRecords: OutreachRecord[];
};

export function certificateStatus(participant: ParticipantWithRecords) {
  const days = new Set(participant.attendanceRecords.map((record) => record.campDay));
  const afternoonFinal = participant.attendanceRecords.some(
    (record) => record.campDay === 11 && record.session === "AFTERNOON"
  );
  const mealDays = new Set(participant.mealRecords.map((record) => `${record.campDay}-${record.meal}`));
  const outreachDays = new Set(participant.outreachRecords.map((record) => record.campDay));
  const attendancePercent = Math.round((participant.attendanceRecords.length / 22) * 100);
  const eligible =
    participant.checkedIn &&
    participant.disciplinaryClearance &&
    days.size >= 9 &&
    afternoonFinal &&
    mealDays.size >= 18 &&
    outreachDays.size >= 3;

  const missing = [
    !participant.checkedIn ? "Camp check-in" : null,
    !participant.disciplinaryClearance ? "Disciplinary clearance" : null,
    days.size < 9 ? `${9 - days.size} more attendance days` : null,
    !afternoonFinal ? "Final afternoon session" : null,
    mealDays.size < 18 ? `${18 - mealDays.size} more meals` : null,
    outreachDays.size < 3 ? `${3 - outreachDays.size} more outreach days` : null
  ].filter(Boolean) as string[];

  return { eligible, attendancePercent, attendedDays: days.size, mealsServed: mealDays.size, outreachDays: outreachDays.size, missing };
}
