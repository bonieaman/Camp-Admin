import { Prisma } from "@prisma/client";
import { campDayFor, dateOnly, ensureSettings, isCampDate, todayInCampTimezone } from "@/lib/camp";
import { prisma } from "@/lib/db";
import { certificateStatus } from "@/lib/eligibility";

export const participantInclude = {
  team: true,
  attendanceRecords: { orderBy: { scannedAt: "desc" } },
  mealRecords: { orderBy: { scannedAt: "desc" } },
  outreachRecords: { orderBy: { completedAt: "desc" } },
  challengeRecords: { orderBy: { completedAt: "desc" } }
} satisfies Prisma.ParticipantInclude;

export async function getParticipants() {
  const participants = await prisma.participant.findMany({
    include: participantInclude,
    orderBy: { fullName: "asc" }
  });
  return participants
    .map((participant) => ({ ...participant, certificate: certificateStatus(participant) }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, undefined, { sensitivity: "base" }));
}

export async function getDashboardStats() {
  const settings = await ensureSettings();
  const today = todayInCampTimezone(settings.timezone);
  const campDay = campDayFor(today);
  const [participants, attendanceToday, mealsToday, recentAttendance, recentMeals, teams] = await Promise.all([
    getParticipants(),
    prisma.attendanceRecord.findMany({ where: { campDate: today }, include: { participant: true } }),
    prisma.mealRecord.findMany({ where: { campDate: today }, include: { participant: true } }),
    prisma.attendanceRecord.findMany({ take: 6, orderBy: { scannedAt: "desc" }, include: { participant: true } }),
    prisma.mealRecord.findMany({ take: 6, orderBy: { scannedAt: "desc" }, include: { participant: true } }),
    prisma.team.findMany({ include: { participants: { include: participantInclude } }, orderBy: { name: "asc" } })
  ]);

  const total = participants.length || 1;
  const morning = attendanceToday.filter((record) => record.session === "MORNING").length;
  const afternoon = attendanceToday.filter((record) => record.session === "AFTERNOON").length;
  const attendancePercent = Math.round((participants.reduce((sum, p) => sum + p.attendanceRecords.length, 0) / (total * 22)) * 100);
  const outreachToday = await prisma.outreachRecord.count({ where: { campDate: today } });
  const outreachThreePlus = participants.filter((p) => p.certificate.outreachDays >= 3).length;

  return {
    settings,
    today,
    campDay,
    participants,
    kpis: {
      registered: participants.length,
      checkedIn: participants.filter((p) => p.checkedIn).length,
      morning,
      afternoon,
      totalAttendance: participants.reduce((sum, p) => sum + p.attendanceRecords.length, 0),
      attendancePercent,
      eligible: participants.filter((p) => p.certificate.eligible).length,
      currentMealServed: mealsToday.length,
      pendingMeals: Math.max(0, participants.length - mealsToday.length),
      outreachToday,
      totalOutreach: participants.reduce((sum, p) => sum + p.outreachRecords.length, 0),
      outreachThreePlus
    },
    recentAttendance,
    recentMeals,
    teams: teams.map((team) => {
      const members = team.participants.map((p) => ({ ...p, certificate: certificateStatus(p) }));
      const count = members.length || 1;
      return {
        id: team.id,
        name: team.name,
        participants: members.length,
        checkedIn: members.filter((p) => p.checkedIn).length,
        morning: members.reduce((sum, p) => sum + (p.attendanceRecords.some((r) => r.campDay === campDay && r.session === "MORNING") ? 1 : 0), 0),
        afternoon: members.reduce((sum, p) => sum + (p.attendanceRecords.some((r) => r.campDay === campDay && r.session === "AFTERNOON") ? 1 : 0), 0),
        avgAttendance: Math.round((members.reduce((sum, p) => sum + p.attendanceRecords.length, 0) / (count * 22)) * 100),
        eligible: members.filter((p) => p.certificate.eligible).length
      };
    })
  };
}

export async function recordAttendance(payload: string, date: string, session: string) {
  const { parseQrPayload } = await import("@/lib/qr");
  const parsed = parseQrPayload(payload);
  if (!parsed) return { ok: false, message: "Invalid Youth Camp QR code." };
  const participant = await prisma.participant.findUnique({ where: { participantId: parsed.participantId } });
  if (!participant || participant.qrToken !== parsed.qrToken) return { ok: false, message: "Participant was not found for this QR code." };
  return recordAttendanceForParticipant(participant.participantId, date, session, "QR_SCAN");
}

export function participantIdFromNumeric(value: string, prefix = "YC-2026") {
  const trimmed = value.trim();
  if (/^YC-\d{4}-\d+$/i.test(trimmed)) return trimmed.toUpperCase();
  if (!/^\d+$/.test(trimmed)) return "";
  return `${prefix}-${String(Number(trimmed)).padStart(3, "0")}`;
}

export async function recordAttendanceForParticipant(participantCode: string, date: string, session: string, source = "MANUAL_ID") {
  const settings = await ensureSettings();
  const participantId = participantIdFromNumeric(participantCode, settings.participantIdPrefix);
  if (!participantId) return { ok: false, message: "Enter a valid participant number." };
  const participant = await prisma.participant.findUnique({ where: { participantId } });
  if (!participant) return { ok: false, message: `No participant found for ${participantId}.` };
  const campDate = dateOnly(date);
  if (!isCampDate(campDate)) return { ok: false, message: "Attendance can only be recorded from July 8 through July 18, 2026." };
  const campDay = campDayFor(campDate);
  try {
    const record = await prisma.$transaction(async (tx) => {
      const attendance = await tx.attendanceRecord.create({
        data: { participantId: participant.id, campDate, campDay, session, source }
      });
      if (session === "AFTERNOON") {
        await tx.outreachRecord.upsert({
          where: { participantId_campDate: { participantId: participant.id, campDate } },
          create: { participantId: participant.id, campDate, campDay },
          update: {}
        });
      }
      await tx.participant.update({
        where: { id: participant.id },
        data: { checkedIn: true, checkedInAt: participant.checkedInAt ?? new Date() }
      });
      return attendance;
    });
    return { ok: true, message: "Attendance recorded.", participant: { name: participant.fullName, id: participant.participantId }, record };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "Attendance has already been recorded for this participant for the selected session.", participant: { name: participant.fullName, id: participant.participantId } };
    }
    throw error;
  }
}

export async function recordMeal(payload: string, date: string, meal: string) {
  const { parseQrPayload } = await import("@/lib/qr");
  const parsed = parseQrPayload(payload);
  if (!parsed) return { ok: false, message: "Invalid Youth Camp QR code." };
  const participant = await prisma.participant.findUnique({ where: { participantId: parsed.participantId } });
  if (!participant || participant.qrToken !== parsed.qrToken) return { ok: false, message: "Participant was not found for this QR code." };
  const campDate = dateOnly(date);
  if (!isCampDate(campDate)) return { ok: false, message: "Meals can only be recorded from July 8 through July 18, 2026." };
  const campDay = campDayFor(campDate);
  try {
    const record = await prisma.$transaction(async (tx) => {
      const mealRecord = await tx.mealRecord.create({ data: { participantId: participant.id, campDate, campDay, meal, source: "QR_SCAN" } });
      await tx.participant.update({
        where: { id: participant.id },
        data: { checkedIn: true, checkedInAt: participant.checkedInAt ?? new Date() }
      });
      return mealRecord;
    });
    return { ok: true, message: "Meal recorded.", participant: { name: participant.fullName, id: participant.participantId }, record };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "This participant has already received that meal.", participant: { name: participant.fullName, id: participant.participantId } };
    }
    throw error;
  }
}

export async function checkInParticipant(participantCode: string) {
  const settings = await ensureSettings();
  const participantId = participantIdFromNumeric(participantCode, settings.participantIdPrefix);
  if (!participantId) return { ok: false, message: "Enter a valid participant number." };
  const participant = await prisma.participant.findUnique({ where: { participantId } });
  if (!participant) return { ok: false, message: `No participant found for ${participantId}.` };
  if (participant.checkedIn) {
    return { ok: false, message: "This participant has already checked in.", participant: { name: participant.fullName, id: participant.participantId } };
  }
  const updated = await prisma.participant.update({
    where: { id: participant.id },
    data: { checkedIn: true, checkedInAt: new Date() }
  });
  return { ok: true, message: "Participant checked in.", participant: { name: updated.fullName, id: updated.participantId } };
}
