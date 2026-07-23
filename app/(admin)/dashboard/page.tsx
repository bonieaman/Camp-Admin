import { BadgeCheck, CalendarCheck, Megaphone, QrCode, Soup, UsersRound } from "lucide-react";
import Link from "next/link";
import { AdminDataUnavailable } from "@/components/AdminDataUnavailable";
import { StatCard } from "@/components/StatCard";
import { activeMealFor } from "@/lib/camp";
import { getDashboardStats } from "@/lib/data";

function pageValue(value: string | string[] | undefined) {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function formatDateTime(value: Date) {
  return {
    date: value.toLocaleDateString("en-US", { timeZone: "Africa/Addis_Ababa", month: "short", day: "numeric", year: "numeric" }),
    time: value.toLocaleTimeString("en-US", { timeZone: "Africa/Addis_Ababa", hour: "2-digit", minute: "2-digit" })
  };
}

function Pagination({ page, total, pageSize, param }: { page: number; total: number; pageSize: number; param: "attendancePage" | "mealPage" }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm font-bold text-slate-600">
      <span>Page {page} of {pages}</span>
      <div className="flex gap-2">
        <Link className={`btn btn-secondary py-2 ${page <= 1 ? "pointer-events-none opacity-50" : ""}`} href={`/dashboard?${param}=${Math.max(1, page - 1)}`}>Previous</Link>
        <Link className={`btn btn-secondary py-2 ${page >= pages ? "pointer-events-none opacity-50" : ""}`} href={`/dashboard?${param}=${Math.min(pages, page + 1)}`}>Next</Link>
      </div>
    </div>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  let data: Awaited<ReturnType<typeof getDashboardStats>>;
  try {
    data = await getDashboardStats({ attendancePage: pageValue(params.attendancePage), mealPage: pageValue(params.mealPage) });
  } catch {
    return <AdminDataUnavailable title="Dashboard data is temporarily unavailable" />;
  }
  const currentMeal = activeMealFor(new Date(), data.settings.timezone);

  return (
    <div className="space-y-7">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Registered Participants" value={data.kpis.registered} detail="Active imported records" icon={UsersRound} />
        <StatCard label="Checked-in Participants" value={data.kpis.checkedIn} detail="Manual, attendance, or meal activity" icon={QrCode} />
        <StatCard label="Attendance" value={`${data.kpis.attendancePercent}%`} detail={`${data.kpis.morning} AM - ${data.kpis.afternoon} PM today`} icon={CalendarCheck} />
        <StatCard label="Certificate Eligible" value={data.kpis.eligible} detail="Meets all current requirements" icon={BadgeCheck} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <StatCard label="Meals" value={currentMeal} detail={`${data.kpis.currentMealServed} served today - ${data.kpis.pendingMeals} pending`} icon={Soup} />
        <StatCard label="Outreach Today" value={data.kpis.outreachToday} detail={`${data.kpis.totalOutreach} total outreach records`} icon={Megaphone} />
        <StatCard label="3+ Outreach Days" value={data.kpis.outreachThreePlus} detail="Participants nearing certificate readiness" icon={BadgeCheck} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-ink">Teams</h2>
          <p className="text-sm font-bold text-slate-500">Day {data.campDay} summary</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                {["Team", "Participants", "Checked in", "Morning", "Afternoon", "Avg attendance", "Eligible"].map((head) => (
                  <th key={head} className="border-b border-slate-200 px-3 py-3">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.teams.map((team) => (
                <tr key={team.id} className="border-b border-slate-100">
                  <td className="px-3 py-4 font-black text-ink">{team.name}</td>
                  <td className="px-3 py-4 font-bold">{team.participants}</td>
                  <td className="px-3 py-4 font-bold">{team.checkedIn}</td>
                  <td className="px-3 py-4 font-bold">{team.morning}</td>
                  <td className="px-3 py-4 font-bold">{team.afternoon}</td>
                  <td className="px-3 py-4 font-bold">{team.avgAttendance}%</td>
                  <td className="px-3 py-4 font-bold">{team.eligible}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 2xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-black text-ink">Recently Recorded Attendance</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>{["Participant", "ID", "Team", "Session", "Date", "Time", "Recorded By"].map((head) => <th key={head} className="border-b border-slate-200 px-3 py-3">{head}</th>)}</tr>
              </thead>
              <tbody>
                {data.recentAttendance.map((record) => {
                  const when = formatDateTime(record.scannedAt);
                  return (
                    <tr key={record.id} className="border-b border-slate-100">
                      <td className="px-3 py-4 font-black text-ink">{record.participant.fullName}</td>
                      <td className="px-3 py-4 font-bold text-royal">{record.participant.participantId}</td>
                      <td className="px-3 py-4 font-bold">{record.participant.team?.name ?? "No Team Assigned"}</td>
                      <td className="px-3 py-4"><span className="status status-slate">{record.session}</span></td>
                      <td className="px-3 py-4 font-bold">{when.date}</td>
                      <td className="px-3 py-4 font-bold">{when.time}</td>
                      <td className="px-3 py-4 font-bold">{record.recordedBy ?? record.source}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!data.recentAttendance.length ? <p className="mt-4 text-sm font-semibold text-slate-500">No attendance records yet.</p> : null}
          <Pagination {...data.recentAttendanceMeta} param="attendancePage" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-black text-ink">Recently Recorded Meals</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>{["Participant", "ID", "Team", "Meal", "Date", "Time", "Recorded By"].map((head) => <th key={head} className="border-b border-slate-200 px-3 py-3">{head}</th>)}</tr>
              </thead>
              <tbody>
                {data.recentMeals.map((record) => {
                  const when = formatDateTime(record.scannedAt);
                  return (
                    <tr key={record.id} className="border-b border-slate-100">
                      <td className="px-3 py-4 font-black text-ink">{record.participant.fullName}</td>
                      <td className="px-3 py-4 font-bold text-royal">{record.participant.participantId}</td>
                      <td className="px-3 py-4 font-bold">{record.participant.team?.name ?? "No Team Assigned"}</td>
                      <td className="px-3 py-4"><span className="status status-green">{record.meal}</span></td>
                      <td className="px-3 py-4 font-bold">{when.date}</td>
                      <td className="px-3 py-4 font-bold">{when.time}</td>
                      <td className="px-3 py-4 font-bold">{record.recordedBy ?? record.source}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!data.recentMeals.length ? <p className="mt-4 text-sm font-semibold text-slate-500">No meal records yet.</p> : null}
          <Pagination {...data.recentMealsMeta} param="mealPage" />
        </div>
      </section>
    </div>
  );
}
