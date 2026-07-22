import { ArrowDownAZ, ArrowUpAZ, BadgeCheck, Percent, Search, UsersRound } from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/StatCard";
import { getAttendancePercentagePage } from "@/lib/data";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function value(params: SearchParams, key: string) {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";
}

function pageValue(params: SearchParams) {
  const parsed = Number(value(params, "page"));
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function hrefWith(params: SearchParams, updates: Record<string, string | number | undefined>) {
  const next = new URLSearchParams();
  for (const [key, raw] of Object.entries(params)) {
    const item = Array.isArray(raw) ? raw[0] : raw;
    if (item) next.set(key, item);
  }
  for (const [key, item] of Object.entries(updates)) {
    if (item === undefined || item === "") next.delete(key);
    else next.set(key, String(item));
  }
  const query = next.toString();
  return query ? `/attendance-percentage?${query}` : "/attendance-percentage";
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{children}</span>;
}

export default async function AttendancePercentagePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const data = await getAttendancePercentagePage({
    query: value(params, "query"),
    teamId: value(params, "teamId"),
    minPercent: value(params, "minPercent"),
    maxPercent: value(params, "maxPercent"),
    sort: value(params, "sort"),
    page: pageValue(params)
  });
  const eligibleCount = data.rows.filter((participant) => participant.certificate.eligible).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Participants Listed" value={data.meta.total} detail="After current filters" icon={UsersRound} />
        <StatCard label="Possible Sessions" value={data.meta.totalPossibleSessions} detail="Saturdays excluded" icon={Percent} />
        <StatCard label="Eligible On Page" value={eligibleCount} detail="Certificate status" icon={BadgeCheck} />
        <StatCard label="Sort Mode" value={value(params, "sort") === "percent-asc" ? "Low to High" : value(params, "sort") === "percent-desc" ? "High to Low" : value(params, "sort") === "name-desc" ? "Z to A" : "A to Z"} detail="Current table ordering" icon={value(params, "sort") === "name-desc" || value(params, "sort") === "percent-desc" ? ArrowDownAZ : ArrowUpAZ} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-ink">Attendance Percentage</h2>
            <p className="text-sm font-bold text-slate-500">Calculated from Morning and Afternoon attendance only, July 15-25, excluding both Saturdays.</p>
          </div>
          <span className="status status-slate">Page {data.meta.page} of {data.meta.totalPages}</span>
        </div>

        <form className="mb-5 grid gap-3 rounded-2xl bg-slate-50 p-4 lg:grid-cols-[1fr_220px_120px_120px_180px_auto]">
          <label>
            <FilterLabel>Search</FilterLabel>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="field pl-11" name="query" placeholder="Name or participant ID" defaultValue={value(params, "query")} />
            </div>
          </label>
          <label>
            <FilterLabel>Team</FilterLabel>
            <select className="field select-premium" name="teamId" defaultValue={value(params, "teamId")}>
              <option value="">All teams</option>
              {data.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
          </label>
          <label>
            <FilterLabel>Min %</FilterLabel>
            <input className="field" type="number" min="0" max="100" name="minPercent" placeholder="0" defaultValue={value(params, "minPercent")} />
          </label>
          <label>
            <FilterLabel>Max %</FilterLabel>
            <input className="field" type="number" min="0" max="100" name="maxPercent" placeholder="100" defaultValue={value(params, "maxPercent")} />
          </label>
          <label>
            <FilterLabel>Sort</FilterLabel>
            <select className="field select-premium" name="sort" defaultValue={value(params, "sort") || "name-asc"}>
              <option value="name-asc">Name A to Z</option>
              <option value="name-desc">Name Z to A</option>
              <option value="percent-desc">Percent high to low</option>
              <option value="percent-asc">Percent low to high</option>
            </select>
          </label>
          <input type="hidden" name="page" value="1" />
          <button className="btn btn-primary self-end"><Search className="h-4 w-4" /> Apply</button>
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
          <div className="flex items-center gap-2">
            <Link className={`btn btn-secondary py-2 ${data.meta.page <= 1 ? "pointer-events-none opacity-50" : ""}`} href={hrefWith(params, { page: Math.max(1, data.meta.page - 1) })}>Previous</Link>
            <span>Page {data.meta.page} of {data.meta.totalPages}</span>
            <Link className={`btn btn-secondary py-2 ${data.meta.page >= data.meta.totalPages ? "pointer-events-none opacity-50" : ""}`} href={hrefWith(params, { page: Math.min(data.meta.totalPages, data.meta.page + 1) })}>Next</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
