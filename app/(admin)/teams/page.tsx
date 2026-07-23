import QRCode from "qrcode";
import type { Prisma } from "@prisma/client";
import { AdminDataUnavailable } from "@/components/AdminDataUnavailable";
import { TeamsManager } from "@/components/TeamsManager";
import { prisma } from "@/lib/db";
import { teamQrPayload } from "@/lib/team-qr";

type TeamOverview = Prisma.TeamGetPayload<{
  include: {
    _count: { select: { participants: true } };
    activities: true;
  };
}>;
type ParticipantForAssignment = Prisma.ParticipantGetPayload<{ include: { team: true } }>;

function activityStatus(activity?: { activityDate: Date; recordedAt: Date } | null) {
  if (!activity) return "Not recorded";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "Africa/Addis_Ababa" }).format(activity.activityDate);
}

export default async function TeamsPage() {
  let teams: TeamOverview[];
  let participants: ParticipantForAssignment[];
  try {
    [teams, participants] = await Promise.all([
      prisma.team.findMany({
        orderBy: { teamCode: "asc" },
        include: {
          _count: { select: { participants: true } },
          activities: { orderBy: { recordedAt: "desc" } }
        }
      }),
      prisma.participant.findMany({
        orderBy: { fullName: "asc" },
        include: { team: true }
      })
    ]);
  } catch {
    return <AdminDataUnavailable title="Team data is temporarily unavailable" />;
  }

  const teamCards = await Promise.all(
    teams.map(async (team) => ({
      id: team.id,
      teamCode: team.teamCode,
      name: team.name,
      description: team.description,
      leader: team.leader,
      color: team.color,
      participants: team._count.participants,
      outreachStatus: activityStatus(team.activities.find((activity) => activity.activityType === "OUTREACH")),
      digitalStatus: activityStatus(team.activities.find((activity) => activity.activityType === "DIGITAL_EVANGELISM")),
      qr: await QRCode.toDataURL(teamQrPayload(team), { width: 640, margin: 2, errorCorrectionLevel: "H" })
    }))
  );

  return (
    <TeamsManager
      teams={teamCards}
      participants={participants.map((participant) => ({
        id: participant.id,
        participantId: participant.participantId,
        fullName: participant.fullName,
        church: participant.church,
        teamId: participant.teamId,
        team: participant.team ? { name: participant.team.name } : null
      }))}
    />
  );
}
