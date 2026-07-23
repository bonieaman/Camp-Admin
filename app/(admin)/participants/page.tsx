import { CheckInParticipant } from "@/components/CheckInParticipant";
import { AdminDataUnavailable } from "@/components/AdminDataUnavailable";
import { ImportParticipants } from "@/components/ImportParticipants";
import { ParticipantsTable } from "@/components/ParticipantsTable";
import { getParticipants } from "@/lib/data";
import { prisma } from "@/lib/db";

export default async function ParticipantsPage() {
  let data: Awaited<ReturnType<typeof getParticipants>>;
  let teams: Awaited<ReturnType<typeof prisma.team.findMany>>;
  try {
    [data, teams] = await Promise.all([getParticipants(), prisma.team.findMany({ orderBy: { name: "asc" } })]);
  } catch {
    return <AdminDataUnavailable title="Participant data is temporarily unavailable" />;
  }
  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-2">
        <ImportParticipants />
        <CheckInParticipant />
      </div>
      <ParticipantsTable participants={data} teams={teams} />
    </div>
  );
}
