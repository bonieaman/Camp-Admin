import { createTeam } from "@/app/(admin)/actions";
import { ensureSettings } from "@/lib/camp";
import { prisma } from "@/lib/db";

export default async function SettingsPage() {
  const [settings, teams] = await Promise.all([ensureSettings(), prisma.team.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { participants: true } } } })]);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-ink">Camp Settings</h2>
        <div className="mt-5 grid gap-4">
          {[
            ["Camp name", settings.campName],
            ["Start date", settings.startDate.toISOString().slice(0, 10)],
            ["End date", settings.endDate.toISOString().slice(0, 10)],
            ["Total days", settings.totalDays],
            ["Timezone", settings.timezone],
            ["Participant ID prefix", settings.participantIdPrefix],
            ["Final required session", `${settings.finalRequiredSession} on ${settings.finalRequiredDate.toISOString().slice(0, 10)}`]
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-black uppercase text-slate-500">{label}</p>
              <p className="mt-1 font-black text-ink">{value}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-ink">Teams</h2>
        <form action={createTeam} className="mt-4 flex gap-3">
          <input name="name" className="field" placeholder="Create team" />
          <button className="btn btn-primary">Create</button>
        </form>
        <div className="mt-5 space-y-3">
          {teams.map((team) => (
            <div key={team.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <p className="font-black text-ink">{team.name}</p>
              <span className="status status-slate">{team._count.participants} participants</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
