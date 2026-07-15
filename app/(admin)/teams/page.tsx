import QRCode from "qrcode";
import { TeamsManager } from "@/components/TeamsManager";
import { prisma } from "@/lib/db";
import { teamQrPayload } from "@/lib/team-qr";

function activityStatus(activity?: { activityDate: Date; recordedAt: Date } | null) {
  if (!activity) return "Not recorded";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "Africa/Addis_Ababa" }).format(activity.activityDate);
}

export default async function TeamsPage() {
  const [teams, participants] = await Promise.all([
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
