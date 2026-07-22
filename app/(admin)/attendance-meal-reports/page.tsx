import { CalendarCheck, Clock3, Search, Soup, Utensils } from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/StatCard";
import { meals, sessions } from "@/lib/camp";
import { getAttendanceMealReports } from "@/lib/data";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function value(params: SearchParams, key: string) {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";
}

function pageValue(params: SearchParams, key: string) {
  const parsed = Number(value(params, key));
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
  return query ? `/attendance-meal-reports?${query}` : "/attendance-meal-reports";
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-US", {
    timeZone: "Africa/Addis_Ababa",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatTime(value: Date | string) {
  return new Date(value).toLocaleTimeString("en-US", {
    timeZone: "Africa/Addis_Ababa",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{children}</span>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-bold text-slate-500">{label}</div>;
}

function Pagination({ params, page, totalPages, pageKey }: { params: SearchParams; page: number; totalPages: number; pageKey: string }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm font-bold text-slate-600">
      <span>Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <Link className={`btn btn-secondary py-2 ${page <= 1 ? "pointer-events-none opacity-50" : ""}`} href={hrefWith(params, { [pageKey]: Math.max(1, page - 1) })}>Previous</Link>
        <Link className={`btn btn-secondary py-2 ${page >= totalPages ? "pointer-events-none opacity-50" : ""}`} href={hrefWith(params, { [pageKey]: Math.min(totalPages, page + 1) })}>Next</Link>
      </div>
    </div>
  );
}

export default async function AttendanceMealReportsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const section = value(params, "section") === "meals" ? "meals" : "attendance";
  const data = await getAttendanceMealReports({
    attendanceDate: value(params, "attendanceDate"),
    attendanceSession: value(params, "attendanceSession"),
    attendanceTeam: value(params, "attendanceTeam"),
    attendanceQuery: value(params, "attendanceQuery"),
    attendancePage: pageValue(params, "attendancePage"),
    mealDate: value(params, "mealDate"),
    mealType: value(params, "mealType"),
    mealTeam: value(params, "mealTeam"),
    mealQuery: value(params, "mealQuery"),
    mealPage: pageValue(params, "mealPage")
  });

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Attendance Records" value={data.summaries.attendance.total} detail={`${data.summaries.attendance.morning} Morning - ${data.summaries.attendance.afternoon} Afternoon`} icon={CalendarCheck} />
        <StatCard label="Morning Records" value={data.summaries.attendance.morning} detail="Filtered attendance" icon={Clock3} />
        <StatCard label="Total Meals Served" value={data.summaries.meals.total} detail={`${data.summaries.meals.breakfast} Breakfast - ${data.summaries.meals.lunch} Lunch - ${data.summaries.meals.dinner} Dinner`} icon={Soup} />
        <StatCard label="Dinner Records" value={data.summaries.meals.dinner} detail="Filtered meals" icon={Utensils} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-ink">Attendance & Meal Reports</h2>
            <p className="text-sm font-bold text-slate-500">Choose one report type, then filter the records you need.</p>
          </div>
          <div className="grid rounded-2xl bg-slate-100 p-1 text-sm font-black sm:grid-cols-2">
            <Link className={`rounded-xl px-5 py-3 text-center transition ${section === "attendance" ? "bg-white text-royal shadow-sm" : "text-slate-600 hover:text-ink"}`} href={hrefWith(params, { section: "attendance" })}>Attendance</Link>
            <Link className={`rounded-xl px-5 py-3 text-center transition ${section === "meals" ? "bg-white text-royal shadow-sm" : "text-slate-600 hover:text-ink"}`} href={hrefWith(params, { section: "meals" })}>Meals</Link>
          </div>
        </div>

        {section === "attendance" ? (
          <div className="space-y-5">
            <form className="grid gap-3 rounded-2xl bg-slate-50 p-4 lg:grid-cols-[170px_180px_220px_1fr_auto]">
              <input type="hidden" name="section" value="attendance" />
              <input type="hidden" name="attendancePage" value="1" />
              <label>
                <FilterLabel>Date</FilterLabel>
                <input className="field" type="date" name="attendanceDate" defaultValue={value(params, "attendanceDate")} />
              </label>
              <label>
                <FilterLabel>Session</FilterLabel>
                <select className="field select-premium" name="attendanceSession" defaultValue={value(params, "attendanceSession") || "ALL"}>
                  <option value="ALL">All Sessions</option>
                  {sessions.map((session) => <option key={session} value={session}>{session === "MORNING" ? "Morning" : "Afternoon"}</option>)}
                </select>
              </label>
              <label>
                <FilterLabel>Team</FilterLabel>
                <select className="field select-premium" name="attendanceTeam" defaultValue={value(params, "attendanceTeam")}>
                  <option value="">All teams</option>
                  {data.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
              </label>
              <label>
                <FilterLabel>Participant</FilterLabel>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input className="field pl-11" name="attendanceQuery" placeholder="Name or participant ID" defaultValue={value(params, "attendanceQuery")} />
                </div>
              </label>
              <button className="btn btn-primary self-end"><Search className="h-4 w-4" /> Filter</button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr>{["Participant ID", "Name", "Team", "Session", "Date", "Time Recorded"].map((head) => <th key={head} className="border-b border-slate-200 px-3 py-3">{head}</th>)}</tr>
                </thead>
                <tbody>
                  {data.attendanceRecords.map((record) => (
                    <tr key={record.id} className="border-b border-slate-100">
                      <td className="px-3 py-4 font-black text-royal">{record.participant.participantId}</td>
                      <td className="px-3 py-4 font-black text-ink">{record.participant.fullName}</td>
                      <td className="px-3 py-4 font-bold text-slate-600">{record.participant.team?.name ?? "No Team Assigned"}</td>
                      <td className="px-3 py-4"><span className="status status-slate">{record.session === "MORNING" ? "Morning" : "Afternoon"}</span></td>
                      <td className="px-3 py-4 font-bold text-slate-700">{formatDate(record.campDate)}</td>
                      <td className="px-3 py-4 font-bold text-slate-700">{formatTime(record.scannedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!data.attendanceRecords.length ? <EmptyState label="No attendance records match these filters." /> : null}
            <Pagination params={params} page={data.attendanceMeta.page} totalPages={data.attendanceMeta.totalPages} pageKey="attendancePage" />
          </div>
        ) : null}

        {section === "meals" ? (
          <div className="space-y-5">
            <form className="grid gap-3 rounded-2xl bg-slate-50 p-4 lg:grid-cols-[170px_180px_220px_1fr_auto]">
              <input type="hidden" name="section" value="meals" />
              <input type="hidden" name="mealPage" value="1" />
              <label>
                <FilterLabel>Date</FilterLabel>
                <input className="field" type="date" name="mealDate" defaultValue={value(params, "mealDate")} />
              </label>
              <label>
                <FilterLabel>Meal</FilterLabel>
                <select className="field select-premium" name="mealType" defaultValue={value(params, "mealType") || "ALL"}>
                  <option value="ALL">All Meals</option>
                  {meals.map((meal) => <option key={meal} value={meal}>{meal.charAt(0) + meal.slice(1).toLowerCase()}</option>)}
                </select>
              </label>
              <label>
                <FilterLabel>Team</FilterLabel>
                <select className="field select-premium" name="mealTeam" defaultValue={value(params, "mealTeam")}>
                  <option value="">All teams</option>
                  {data.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
              </label>
              <label>
                <FilterLabel>Participant</FilterLabel>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input className="field pl-11" name="mealQuery" placeholder="Name or participant ID" defaultValue={value(params, "mealQuery")} />
                </div>
              </label>
              <button className="btn btn-primary self-end"><Search className="h-4 w-4" /> Filter</button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr>{["Participant ID", "Name", "Team", "Meal Type", "Date", "Time Served"].map((head) => <th key={head} className="border-b border-slate-200 px-3 py-3">{head}</th>)}</tr>
                </thead>
                <tbody>
                  {data.mealRecords.map((record) => (
                    <tr key={record.id} className="border-b border-slate-100">
                      <td className="px-3 py-4 font-black text-royal">{record.participant.participantId}</td>
                      <td className="px-3 py-4 font-black text-ink">{record.participant.fullName}</td>
                      <td className="px-3 py-4 font-bold text-slate-600">{record.participant.team?.name ?? "No Team Assigned"}</td>
                      <td className="px-3 py-4"><span className="status status-green">{record.meal.charAt(0) + record.meal.slice(1).toLowerCase()}</span></td>
                      <td className="px-3 py-4 font-bold text-slate-700">{formatDate(record.campDate)}</td>
                      <td className="px-3 py-4 font-bold text-slate-700">{formatTime(record.scannedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!data.mealRecords.length ? <EmptyState label="No meal records match these filters." /> : null}
            <Pagination params={params} page={data.mealMeta.page} totalPages={data.mealMeta.totalPages} pageKey="mealPage" />
          </div>
        ) : null}
      </section>
    </div>
  );
}
