import { BadgeCheck, CalendarCheck, Megaphone, QrCode, Soup, UsersRound } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { activeMealFor } from "@/lib/camp";
import { getDashboardStats } from "@/lib/data";

export default async function DashboardPage() {
  const data = await getDashboardStats();
  const currentMeal = activeMealFor(new Date(), data.settings.timezone);

  return (
    <div className="space-y-7">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Registered Participants" value={data.kpis.registered} detail="Active imported records" icon={UsersRound} />
        <StatCard label="Checked-in Participants" value={data.kpis.checkedIn} detail="Manual, attendance, or meal activity" icon={QrCode} />
        <StatCard label="Attendance" value={`${data.kpis.attendancePercent}%`} detail={`${data.kpis.morning} AM • ${data.kpis.afternoon} PM today`} icon={CalendarCheck} />
        <StatCard label="Certificate Eligible" value={data.kpis.eligible} detail="Meets all current requirements" icon={BadgeCheck} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <StatCard label="Meals" value={currentMeal} detail={`${data.kpis.currentMealServed} served today • ${data.kpis.pendingMeals} pending`} icon={Soup} />
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

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-black text-ink">Recent Attendance Scans</h2>
          <div className="space-y-3">
            {data.recentAttendance.map((record) => (
              <div key={record.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="font-black text-ink">{record.participant.fullName}</p>
                  <p className="text-sm font-semibold text-slate-500">{record.participant.participantId} • Day {record.campDay} {record.session}</p>
                </div>
                <span className="status status-green">Recorded</span>
              </div>
            ))}
            {!data.recentAttendance.length ? <p className="text-sm font-semibold text-slate-500">No attendance scans yet.</p> : null}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-black text-ink">Recent Meal Scans</h2>
          <div className="space-y-3">
            {data.recentMeals.map((record) => (
              <div key={record.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="font-black text-ink">{record.participant.fullName}</p>
                  <p className="text-sm font-semibold text-slate-500">{record.participant.participantId} • Day {record.campDay} {record.meal}</p>
                </div>
                <span className="status status-green">Served</span>
              </div>
            ))}
            {!data.recentMeals.length ? <p className="text-sm font-semibold text-slate-500">No meal scans yet.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
