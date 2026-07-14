import { notFound } from "next/navigation";
import { ProfileTabs } from "@/components/ProfileTabs";
import { prisma } from "@/lib/db";
import { certificateStatus } from "@/lib/eligibility";
import { participantInclude } from "@/lib/data";
import { qrDataUrl } from "@/lib/qr";

export default async function ParticipantProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const participant = await prisma.participant.findUnique({ where: { id }, include: participantInclude });
  if (!participant) notFound();
  const [qr, teams] = await Promise.all([
    qrDataUrl(participant.participantId, participant.qrToken, 720),
    prisma.team.findMany({ orderBy: { name: "asc" } })
  ]);
  return <ProfileTabs participant={{ ...participant, certificate: certificateStatus(participant) }} qr={qr} teams={teams} />;
}
