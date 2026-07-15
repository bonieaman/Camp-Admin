import { Prisma } from "@prisma/client";
import { campDayDisplay, campDayFor, dateOnly, ensureSettings, isCampDate, todayInCampTimezone } from "@/lib/camp";
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

const DASHBOARD_ACTIVITY_PAGE_SIZE = 6;

export async function getDashboardStats({ attendancePage = 1, mealPage = 1 } = {}) {
  const settings = await ensureSettings();
  const today = todayInCampTimezone(settings.timezone);
  const campDay = campDayDisplay(today, settings.totalDays);
  const attendanceSkip = Math.max(0, attendancePage - 1) * DASHBOARD_ACTIVITY_PAGE_SIZE;
  const mealSkip = Math.max(0, mealPage - 1) * DASHBOARD_ACTIVITY_PAGE_SIZE;
  const [participants, attendanceToday, mealsToday, recentAttendance, recentMeals, recentAttendanceCount, recentMealsCount, teams] = await Promise.all([
    getParticipants(),
    prisma.attendanceRecord.findMany({ where: { campDate: today }, include: { participant: true } }),
    prisma.mealRecord.findMany({ where: { campDate: today }, include: { participant: true } }),
    prisma.attendanceRecord.findMany({ skip: attendanceSkip, take: DASHBOARD_ACTIVITY_PAGE_SIZE, orderBy: { scannedAt: "desc" }, include: { participant: { include: { team: true } } } }),
    prisma.mealRecord.findMany({ skip: mealSkip, take: DASHBOARD_ACTIVITY_PAGE_SIZE, orderBy: { scannedAt: "desc" }, include: { participant: { include: { team: true } } } }),
    prisma.attendanceRecord.count(),
    prisma.mealRecord.count(),
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
    recentAttendanceMeta: { page: attendancePage, pageSize: DASHBOARD_ACTIVITY_PAGE_SIZE, total: recentAttendanceCount },
    recentMealsMeta: { page: mealPage, pageSize: DASHBOARD_ACTIVITY_PAGE_SIZE, total: recentMealsCount },
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

export async function lookupParticipantByQr(payload: string) {
  const { parseQrPayload } = await import("@/lib/qr");
  const parsed = parseQrPayload(payload);
  if (!parsed) return null;
  const participant = await prisma.participant.findUnique({ where: { participantId: parsed.participantId }, include: { team: true } });
  if (!participant || participant.qrToken !== parsed.qrToken) return null;
  return participant;
}

export async function lookupParticipantByCode(participantCode: string) {
  const settings = await ensureSettings();
  const participantId = participantIdFromNumeric(participantCode, settings.participantIdPrefix);
  if (!participantId) return null;
  return prisma.participant.findUnique({ where: { participantId }, include: { team: true } });
}

export async function recordAttendance(payload: string, date: string, session: string, recordedBy?: string) {
  const participant = await lookupParticipantByQr(payload);
  if (!participant) return { ok: false, message: "Participant was not found for this QR code." };
  return recordAttendanceForParticipant(participant.participantId, date, session, "QR_SCAN", recordedBy);
}

export function participantIdFromNumeric(value: string, prefix = "YC-2026") {
  const trimmed = value.trim();
  if (/^YC-\d{4}-\d+$/i.test(trimmed)) return trimmed.toUpperCase();
  if (!/^\d+$/.test(trimmed)) return "";
  return `${prefix}-${String(Number(trimmed)).padStart(3, "0")}`;
}

export async function recordAttendanceForParticipant(participantCode: string, date: string, session: string, source = "MANUAL_ID", recordedBy?: string) {
  const settings = await ensureSettings();
  const participantId = participantIdFromNumeric(participantCode, settings.participantIdPrefix);
  if (!participantId) return { ok: false, message: "Enter a valid participant number." };
  const participant = await prisma.participant.findUnique({ where: { participantId } });
  if (!participant) return { ok: false, message: `No participant found for ${participantId}.` };
  const campDate = dateOnly(date);
  if (!isCampDate(campDate)) return { ok: false, message: "Attendance can only be recorded from July 8 through July 18, 2026." };
  const campDay = campDayFor(campDate);
  const existing = await prisma.attendanceRecord.findUnique({
    where: { participantId_campDate_session: { participantId: participant.id, campDate, session } }
  });
  if (existing) {
    return { ok: false, message: "Attendance has already been recorded for this participant for this session today.", participant: { name: participant.fullName, id: participant.participantId } };
  }
  try {
    const record = await prisma.$transaction(async (tx) => {
      const attendance = await tx.attendanceRecord.create({
        data: { participantId: participant.id, campDate, campDay, session, source, recordedBy }
      });
      if (session === "AFTERNOON") {
        await tx.outreachRecord.upsert({
          where: { participantId_campDate: { participantId: participant.id, campDate } },
          create: { participantId: participant.id, campDate, campDay, recordedBy },
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
      return { ok: false, message: "Attendance has already been recorded for this participant for this session today.", participant: { name: participant.fullName, id: participant.participantId } };
    }
    throw error;
  }
}

export async function recordMeal(payload: string, date: string, meal: string, recordedBy?: string) {
  const participant = await lookupParticipantByQr(payload);
  if (!participant) return { ok: false, message: "Participant was not found for this QR code." };
  return recordMealForParticipant(participant.participantId, date, meal, "QR_SCAN", recordedBy);
}

export async function recordMealForParticipant(participantCode: string, date: string, meal: string, source = "MANUAL_ID", recordedBy?: string) {
  const settings = await ensureSettings();
  const participantId = participantIdFromNumeric(participantCode, settings.participantIdPrefix);
  if (!participantId) return { ok: false, message: "Enter a valid participant number." };
  const participant = await prisma.participant.findUnique({ where: { participantId } });
  if (!participant) return { ok: false, message: `No participant found for ${participantId}.` };
  const campDate = dateOnly(date);
  if (!isCampDate(campDate)) return { ok: false, message: "Meals can only be recorded from July 8 through July 18, 2026." };
  const campDay = campDayFor(campDate);
  const existing = await prisma.mealRecord.findUnique({
    where: { participantId_campDate_meal: { participantId: participant.id, campDate, meal } }
  });
  if (existing) {
    return { ok: false, message: `This participant has already been served ${mealLabel(meal)} today.`, participant: { name: participant.fullName, id: participant.participantId } };
  }
  try {
    const record = await prisma.$transaction(async (tx) => {
      const mealRecord = await tx.mealRecord.create({ data: { participantId: participant.id, campDate, campDay, meal, source, recordedBy } });
      await tx.participant.update({
        where: { id: participant.id },
        data: { checkedIn: true, checkedInAt: participant.checkedInAt ?? new Date() }
      });
      return mealRecord;
    });
    return { ok: true, message: "Meal recorded.", participant: { name: participant.fullName, id: participant.participantId }, record };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: `This participant has already been served ${mealLabel(meal)} today.`, participant: { name: participant.fullName, id: participant.participantId } };
    }
    throw error;
  }
}

function mealLabel(meal: string) {
  return meal.slice(0, 1).toUpperCase() + meal.slice(1).toLowerCase();
}

export async function participantActionStatus(participantDbId: string, date: string, action: "attendance" | "meal", value: string) {
  const campDate = dateOnly(date);
  if (action === "attendance") {
    const exists = await prisma.attendanceRecord.findUnique({
      where: { participantId_campDate_session: { participantId: participantDbId, campDate, session: value } }
    });
    return exists ? "Recorded" : "Not recorded";
  }
  const exists = await prisma.mealRecord.findUnique({
    where: { participantId_campDate_meal: { participantId: participantDbId, campDate, meal: value } }
  });
  return exists ? "Served" : "Not served";
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

export type TeamActivityType = "OUTREACH" | "DIGITAL_EVANGELISM";

const teamActivityLabels: Record<TeamActivityType, string> = {
  OUTREACH: "Outreach",
  DIGITAL_EVANGELISM: "Digital Evangelism"
};

export async function lookupTeamActivity(payload: string, selectedTeamId: string, date: string, activityType: TeamActivityType) {
  const { lookupTeamByQr } = await import("@/lib/team-qr");
  const scannedTeam = await lookupTeamByQr(payload);
  if (!scannedTeam) return { ok: false, message: "Team was not found for this QR code." };
  if (scannedTeam.id !== selectedTeamId) return { ok: false, message: "The scanned QR code does not match the selected team." };
  const campDate = dateOnly(date);
  if (!isCampDate(campDate)) return { ok: false, message: `${teamActivityLabels[activityType]} can only be recorded from July 8 through July 18, 2026.` };
  const existing = await prisma.teamActivity.findUnique({
    where: { teamId_activityDate_activityType: { teamId: scannedTeam.id, activityDate: campDate, activityType } }
  });
  return {
    ok: true,
    team: { id: scannedTeam.id, teamCode: scannedTeam.teamCode, name: scannedTeam.name, participants: scannedTeam._count.participants },
    status: existing ? "Recorded" : "Not recorded"
  };
}

export async function lookupTeamActivityByCode(teamCodeValue: string, selectedTeamId: string, date: string, activityType: TeamActivityType) {
  const { teamCodeFromNumeric } = await import("@/lib/teams");
  const teamCode = teamCodeFromNumeric(teamCodeValue);
  if (!teamCode) return { ok: false, message: "Enter a valid team number." };
  const team = await prisma.team.findUnique({ where: { teamCode }, include: { _count: { select: { participants: true } } } });
  if (!team) return { ok: false, message: `No team found for ${teamCode}.` };
  if (team.id !== selectedTeamId) return { ok: false, message: "The entered Team ID does not match the selected team." };
  const campDate = dateOnly(date);
  if (!isCampDate(campDate)) return { ok: false, message: `${teamActivityLabels[activityType]} can only be recorded from July 8 through July 18, 2026.` };
  const existing = await prisma.teamActivity.findUnique({
    where: { teamId_activityDate_activityType: { teamId: team.id, activityDate: campDate, activityType } }
  });
  return {
    ok: true,
    team: { id: team.id, teamCode: team.teamCode, name: team.name, participants: team._count.participants },
    status: existing ? "Recorded" : "Not recorded"
  };
}

export async function recordTeamActivity(teamId: string, date: string, activityType: TeamActivityType, recordedBy?: string) {
  const campDate = dateOnly(date);
  if (!isCampDate(campDate)) return { ok: false, message: `${teamActivityLabels[activityType]} can only be recorded from July 8 through July 18, 2026.` };
  const team = await prisma.team.findUnique({ where: { id: teamId }, include: { participants: { select: { id: true } } } });
  if (!team) return { ok: false, message: "Select a valid team." };
  if (!team.participants.length) return { ok: false, message: "This team has no participants to record." };
  const existing = await prisma.teamActivity.findUnique({
    where: { teamId_activityDate_activityType: { teamId, activityDate: campDate, activityType } }
  });
  if (existing) {
    return { ok: false, message: activityType === "OUTREACH" ? "This team has already completed Outreach today." : "This team has already completed Digital Evangelism today." };
  }

  const campDay = campDayFor(campDate);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.teamActivity.create({ data: { teamId, activityDate: campDate, activityType, recordedBy } });
      if (activityType === "OUTREACH") {
        await tx.outreachRecord.createMany({
          data: team.participants.map((participant) => ({
            participantId: participant.id,
            campDate,
            campDay,
            source: "TEAM_OUTREACH",
            recordedBy
          })),
          skipDuplicates: true
        });
      } else {
        await tx.challengeRecord.createMany({
          data: team.participants.map((participant) => ({
            participantId: participant.id,
            campDate,
            campDay,
            challenge: "DIGITAL_EVANGELISM",
            recordedBy
          })),
          skipDuplicates: true
        });
      }
    });
    return { ok: true, message: `${teamActivityLabels[activityType]} recorded for ${team.name}.`, team: { name: team.name } };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: activityType === "OUTREACH" ? "This team has already completed Outreach today." : "This team has already completed Digital Evangelism today." };
    }
    throw error;
  }
}

export async function getTeamActivityPage(activityType: TeamActivityType) {
  const settings = await ensureSettings();
  const today = todayInCampTimezone(settings.timezone);
  const [teams, history] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { participants: true } } } }),
    prisma.teamActivity.findMany({
      where: { activityType },
      take: 12,
      orderBy: { recordedAt: "desc" },
      include: { team: { include: { _count: { select: { participants: true } } } } }
    })
  ]);
  return { today, teams, history };
}
