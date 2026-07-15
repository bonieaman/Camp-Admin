import QRCode from "qrcode";
import { notFound } from "next/navigation";
import { TeamDetails } from "@/components/TeamDetails";
import { prisma } from "@/lib/db";
import { certificateStatus } from "@/lib/eligibility";
import { teamQrPayload } from "@/lib/team-qr";

export default async function TeamDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [team, teams, availableParticipants] = await Promise.all([
    prisma.team.findUnique({
      where: { id },
      include: {
        participants: {
          orderBy: { fullName: "asc" },
          include: {
            team: true,
            attendanceRecords: true,
            mealRecords: true,
            outreachRecords: true,
            challengeRecords: true
          }
        }
      }
    }),
    prisma.team.findMany({ orderBy: { teamCode: "asc" }, select: { id: true, teamCode: true, name: true } }),
    prisma.participant.findMany({
      where: { NOT: { teamId: id } },
      orderBy: { fullName: "asc" },
      include: {
        team: true,
        attendanceRecords: true,
        mealRecords: true,
        outreachRecords: true,
        challengeRecords: true
      }
    })
  ]);

  if (!team) notFound();
  const qr = await QRCode.toDataURL(teamQrPayload(team), { width: 820, margin: 2, errorCorrectionLevel: "H" });

  return (
    <TeamDetails
      team={{
        id: team.id,
        teamCode: team.teamCode,
        name: team.name,
        description: team.description,
        leader: team.leader,
        color: team.color,
        qr
      }}
      teams={teams}
      participants={team.participants.map((participant) => ({
        id: participant.id,
        participantId: participant.participantId,
        fullName: participant.fullName,
        gender: participant.gender,
        church: participant.church,
        phone: participant.phone,
        certificate: certificateStatus(participant)
      }))}
      availableParticipants={availableParticipants.map((participant) => ({
        id: participant.id,
        participantId: participant.participantId,
        fullName: participant.fullName,
        gender: participant.gender,
        church: participant.church,
        phone: participant.phone,
        teamName: participant.team?.name ?? null,
        certificate: certificateStatus(participant)
      }))}
    />
  );
}
