import { CheckInParticipant } from "@/components/CheckInParticipant";
import { ImportParticipants } from "@/components/ImportParticipants";
import { ParticipantsTable } from "@/components/ParticipantsTable";
import { getParticipants } from "@/lib/data";
import { prisma } from "@/lib/db";

export default async function ParticipantsPage() {
  const [participants, teams] = await Promise.all([getParticipants(), prisma.team.findMany({ orderBy: { name: "asc" } })]);
  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-2">
        <ImportParticipants />
        <CheckInParticipant />
      </div>
      <ParticipantsTable participants={participants} teams={teams} />
    </div>
  );
}
