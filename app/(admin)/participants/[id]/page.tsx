import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { AdminDataUnavailable } from "@/components/AdminDataUnavailable";
import { ProfileTabs } from "@/components/ProfileTabs";
import { prisma } from "@/lib/db";
import { certificateStatus } from "@/lib/eligibility";
import { participantInclude } from "@/lib/data";
import { qrDataUrl } from "@/lib/qr";

type ParticipantForProfile = Prisma.ParticipantGetPayload<{ include: typeof participantInclude }>;

export default async function ParticipantProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let participant: ParticipantForProfile | null;
  try {
    participant = await prisma.participant.findUnique({ where: { id }, include: participantInclude });
  } catch {
    return <AdminDataUnavailable title="Participant profile is temporarily unavailable" />;
  }
  if (!participant) notFound();
  let qr: string;
  let teams: Awaited<ReturnType<typeof prisma.team.findMany>>;
  try {
    [qr, teams] = await Promise.all([
      qrDataUrl(participant.participantId, participant.qrToken, 720),
      prisma.team.findMany({ orderBy: { name: "asc" } })
    ]);
  } catch {
    return <AdminDataUnavailable title="Participant profile is temporarily unavailable" />;
  }
  return <ProfileTabs participant={{ ...participant, certificate: certificateStatus(participant) }} qr={qr} teams={teams} />;
}
