import { BadgeCheck, Percent, SlidersHorizontal, UsersRound } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { getAttendancePercentagePage } from "@/lib/data";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function value(params: SearchParams, key: string) {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{children}</span>;
}

export default async function AttendancePercentagePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const data = await getAttendancePercentagePage({
    minPercent: value(params, "minPercent"),
    maxPercent: value(params, "maxPercent")
  });
  const eligibleCount = data.rows.filter((participant) => participant.certificate.eligible).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Participants Listed" value={data.meta.total} detail="After current filters" icon={UsersRound} />
        <StatCard label="Possible Sessions" value={data.meta.totalPossibleSessions} detail="Fixed attendance maximum" icon={Percent} />
        <StatCard label="Eligible On Page" value={eligibleCount} detail="Certificate status" icon={BadgeCheck} />
        <StatCard label="Formula" value="/ 16" detail="Distinct Morning/Afternoon records" icon={SlidersHorizontal} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-ink">Attendance Percentage</h2>
            <p className="text-sm font-bold text-slate-500">Calculated from Morning and Afternoon attendance only. Meals are excluded.</p>
          </div>
          <span className="status status-slate">{data.meta.total} participants displayed</span>
        </div>

        <form className="mb-5 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[140px_140px_auto]">
          <label>
            <FilterLabel>Min %</FilterLabel>
            <input className="field" type="number" min="0" max="100" name="minPercent" placeholder="0" defaultValue={value(params, "minPercent")} />
          </label>
          <label>
            <FilterLabel>Max %</FilterLabel>
            <input className="field" type="number" min="0" max="100" name="maxPercent" placeholder="100" defaultValue={value(params, "maxPercent")} />
          </label>
          <button className="btn btn-primary self-end"><SlidersHorizontal className="h-4 w-4" /> Apply</button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                {["Participant ID", "Full Name", "Team", "Attendance Percentage", "Total Sessions Attended", "Total Possible Sessions", "Certificate Eligibility Status"].map((head) => (
                  <th key={head} className="border-b border-slate-200 px-3 py-3">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((participant) => (
                <tr key={participant.id} className="border-b border-slate-100">
                  <td className="px-3 py-4 font-black text-royal">{participant.participantId}</td>
                  <td className="px-3 py-4 font-black text-ink">{participant.fullName}</td>
                  <td className="px-3 py-4 font-bold text-slate-600">{participant.team ? `${participant.team.name}${participant.team.teamCode ? ` (${participant.team.teamCode})` : ""}` : "No Team Assigned"}</td>
                  <td className="px-3 py-4">
                    <span className={`status ${participant.certificate.attendancePercent >= 90 ? "status-green" : participant.certificate.attendancePercent >= 70 ? "status-slate" : "status-amber"}`}>{participant.certificate.attendancePercent}%</span>
                  </td>
                  <td className="px-3 py-4 font-bold text-slate-700">{participant.certificate.totalSessionsAttended}</td>
                  <td className="px-3 py-4 font-bold text-slate-700">{participant.certificate.totalPossibleSessions}</td>
                  <td className="px-3 py-4"><span className={`status ${participant.certificate.eligible ? "status-green" : "status-slate"}`}>{participant.certificate.eligible ? "Eligible" : "Not eligible"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data.rows.length ? <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-bold text-slate-500">No participants match these filters.</div> : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-slate-600">
          <span>{data.meta.total} participants</span>
          <span>All matching participants are shown.</span>
        </div>
      </section>
    </div>
  );
}
