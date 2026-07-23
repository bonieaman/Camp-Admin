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
  teams: "Teams",
  outreach: "Outreach",
  "digital-evangelism": "Digital Evangelism",
  "attendance-percentage": "Attendance Percentage",
  "attendance-meal-reports": "Attendance & Meal Reports",
  certificates: "Certificates",
  settings: "Settings"
};

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  let campLine = "Camp data temporarily unavailable";
  try {
    const settings = await ensureSettings();
    const today = todayInCampTimezone(settings.timezone);
    const campDay = campDayDisplay(today, settings.totalDays);
    campLine = `Day ${campDay} / ${settings.totalDays} - ${settings.timezone}`;
  } catch {
    campLine = "Database connection unavailable";
  }

  return (
    <AdminShell title="Youth Camp 2026" campLine={campLine} role={session.role}>
      <RealtimeRefresh />
      {children}
    </AdminShell>
  );
}
