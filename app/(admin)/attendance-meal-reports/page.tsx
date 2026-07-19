import { CalendarDays, ChevronDown, Clock3, Search, Soup, UsersRound } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { meals, sessions } from "@/lib/camp";
import { getAttendanceMealReports } from "@/lib/data";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function value(params: SearchParams, key: string) {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";
}

function ymd(date: Date | string) {
  const value = typeof date === "string" ? date : date.toISOString();
  return value.slice(0, 10);
}

function formatDate(date: string, today: Date) {
  const dateValue = new Date(`${date}T00:00:00.000Z`);
  const todayValue = ymd(today);
  const label = dateValue.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  return date === todayValue ? `${label} - Today` : label;
}

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("en-US", {
    timeZone: "Africa/Addis_Ababa",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function campDayLabel(day: number, totalDays: number) {
  return day >= 1 && day <= totalDays ? `Day ${day}` : "Outside camp dates";
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{children}</span>;
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-bold text-slate-500">
      {label}
    </div>
  );
}

type AttendanceRecord = Awaited<ReturnType<typeof getAttendanceMealReports>>["attendanceDates"][number]["morning"][number];
type MealRecord = Awaited<ReturnType<typeof getAttendanceMealReports>>["mealDates"][number]["breakfast"][number];

function AttendanceTable({ records }: { records: AttendanceRecord[] }) {
  if (!records.length) return <EmptyState label="No attendance records in this session." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="text-xs uppercase text-slate-500">
          <tr>
            {["Participant ID", "Name", "Team", "Time Recorded"].map((head) => (
              <th key={head} className="border-b border-slate-200 px-3 py-3">{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-b border-slate-100">
              <td className="px-3 py-4 font-black text-royal">{record.participant.participantId}</td>
              <td className="px-3 py-4 font-black text-ink">{record.participant.fullName}</td>
              <td className="px-3 py-4 font-bold text-slate-600">{record.participant.team?.name ?? "No Team Assigned"}</td>
              <td className="px-3 py-4 font-bold text-slate-700">{formatTime(record.scannedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MealTable({ records }: { records: MealRecord[] }) {
  if (!records.length) return <EmptyState label="No meal records in this meal type." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="text-xs uppercase text-slate-500">
          <tr>
            {["Participant ID", "Name", "Team", "Time Served"].map((head) => (
              <th key={head} className="border-b border-slate-200 px-3 py-3">{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-b border-slate-100">
              <td className="px-3 py-4 font-black text-royal">{record.participant.participantId}</td>
              <td className="px-3 py-4 font-black text-ink">{record.participant.fullName}</td>
              <td className="px-3 py-4 font-bold text-slate-600">{record.participant.team?.name ?? "No Team Assigned"}</td>
              <td className="px-3 py-4 font-bold text-slate-700">{formatTime(record.scannedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Disclosure({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-ink">{title}</p>
          <p className="text-xs font-bold text-slate-500">{count} record{count === 1 ? "" : "s"}</p>
        </div>
        <ChevronDown className="h-5 w-5 text-slate-400 transition group-open:rotate-180" />
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

export default async function AttendanceMealReportsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const data = await getAttendanceMealReports({
    attendanceDate: value(params, "attendanceDate"),
    attendanceSession: value(params, "attendanceSession"),
    attendanceTeam: value(params, "attendanceTeam"),
    attendanceQuery: value(params, "attendanceQuery"),
    mealDate: value(params, "mealDate"),
    mealType: value(params, "mealType"),
    mealTeam: value(params, "mealTeam"),
    mealQuery: value(params, "mealQuery")
  });

  return (
    <div className="space-y-7">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Attendance Records" value={data.summaries.attendance.total} detail="Filtered attendance records" icon={CalendarDays} />
        <StatCard label="Morning Records" value={data.summaries.attendance.morning} detail="Morning attendance" icon={Clock3} />
        <StatCard label="Afternoon Records" value={data.summaries.attendance.afternoon} detail="Afternoon attendance" icon={UsersRound} />
        <StatCard label="Total Meals Served" value={data.summaries.meals.total} detail="Filtered meal records" icon={Soup} />
        <StatCard label="Breakfast Records" value={data.summaries.meals.breakfast} detail="Breakfast served" icon={Soup} />
        <StatCard label="Lunch Records" value={data.summaries.meals.lunch} detail="Lunch served" icon={Soup} />
        <StatCard label="Dinner Records" value={data.summaries.meals.dinner} detail="Dinner served" icon={Soup} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-ink">Attendance Reports</h2>
            <p className="text-sm font-bold text-slate-500">Grouped by recorded date, with Morning and Afternoon separated.</p>
          </div>
          <span className="status status-slate">{data.attendanceDates.length} date group{data.attendanceDates.length === 1 ? "" : "s"}</span>
        </div>

        <form className="mb-5 grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1fr_160px_180px_1fr_auto]">
          <label>
            <FilterLabel>Date</FilterLabel>
            <input className="field" type="date" name="attendanceDate" defaultValue={value(params, "attendanceDate")} />
          </label>
          <label>
            <FilterLabel>Session</FilterLabel>
            <select className="field select-premium" name="attendanceSession" defaultValue={value(params, "attendanceSession") || "ALL"}>
              <option value="ALL">All sessions</option>
              {sessions.map((session) => <option key={session} value={session}>{session}</option>)}
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
            <input className="field" name="attendanceQuery" placeholder="Name or participant ID" defaultValue={value(params, "attendanceQuery")} />
          </label>
          <button className="btn btn-primary self-end"><Search className="h-4 w-4" /> Filter</button>
        </form>

        <div className="space-y-4">
          {data.attendanceDates.map((group) => (
            <article key={group.date} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-black text-ink">{formatDate(group.date, data.today)}</h3>
                  <p className="text-sm font-bold text-slate-500">{campDayLabel(group.campDay, data.settings.totalDays)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="status status-slate">Morning {group.morning.length}</span>
                  <span className="status status-slate">Afternoon {group.afternoon.length}</span>
                  <span className="status status-green">Total {group.morning.length + group.afternoon.length}</span>
                </div>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <Disclosure title="Morning Session" count={group.morning.length}><AttendanceTable records={group.morning} /></Disclosure>
                <Disclosure title="Afternoon Session" count={group.afternoon.length}><AttendanceTable records={group.afternoon} /></Disclosure>
              </div>
            </article>
          ))}
          {!data.attendanceDates.length ? <EmptyState label="No attendance records match these filters." /> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-ink">Meals Reports</h2>
            <p className="text-sm font-bold text-slate-500">Breakfast, Lunch, and Dinner are kept separate for every recorded date.</p>
          </div>
          <span className="status status-slate">{data.mealDates.length} date group{data.mealDates.length === 1 ? "" : "s"}</span>
        </div>

        <form className="mb-5 grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1fr_160px_180px_1fr_auto]">
          <label>
            <FilterLabel>Date</FilterLabel>
            <input className="field" type="date" name="mealDate" defaultValue={value(params, "mealDate")} />
          </label>
          <label>
            <FilterLabel>Meal</FilterLabel>
            <select className="field select-premium" name="mealType" defaultValue={value(params, "mealType") || "ALL"}>
              <option value="ALL">All meals</option>
              {meals.map((meal) => <option key={meal} value={meal}>{meal}</option>)}
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
            <input className="field" name="mealQuery" placeholder="Name or participant ID" defaultValue={value(params, "mealQuery")} />
          </label>
          <button className="btn btn-primary self-end"><Search className="h-4 w-4" /> Filter</button>
        </form>

        <div className="space-y-4">
          {data.mealDates.map((group) => (
            <article key={group.date} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-black text-ink">{formatDate(group.date, data.today)}</h3>
                  <p className="text-sm font-bold text-slate-500">{campDayLabel(group.campDay, data.settings.totalDays)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="status status-slate">Breakfast {group.breakfast.length}</span>
                  <span className="status status-slate">Lunch {group.lunch.length}</span>
                  <span className="status status-slate">Dinner {group.dinner.length}</span>
                  <span className="status status-green">Total {group.breakfast.length + group.lunch.length + group.dinner.length}</span>
                </div>
              </div>
              <div className="grid gap-4 xl:grid-cols-3">
                <Disclosure title="Breakfast" count={group.breakfast.length}><MealTable records={group.breakfast} /></Disclosure>
                <Disclosure title="Lunch" count={group.lunch.length}><MealTable records={group.lunch} /></Disclosure>
                <Disclosure title="Dinner" count={group.dinner.length}><MealTable records={group.dinner} /></Disclosure>
              </div>
            </article>
          ))}
          {!data.mealDates.length ? <EmptyState label="No meal records match these filters." /> : null}
        </div>
      </section>
    </div>
  );
}
