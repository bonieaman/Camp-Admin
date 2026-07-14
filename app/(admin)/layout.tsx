import { redirect } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { campDayDisplay, ensureSettings, todayInCampTimezone } from "@/lib/camp";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const titles: Record<string, string> = {
  dashboard: "Dashboard",
  participants: "Participants",
  attendance: "Attendance",
  meals: "Meals",
  certificates: "Certificates",
  settings: "Settings"
};

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const settings = await ensureSettings();
  const today = todayInCampTimezone(settings.timezone);
  const campDay = campDayDisplay(today, settings.totalDays);

  return (
    <AdminShell title="Youth Camp 2026" campLine={`Day ${campDay} / ${settings.totalDays} • ${settings.timezone}`}>
      <RealtimeRefresh interval={2500} />
      {children}
    </AdminShell>
  );
}
