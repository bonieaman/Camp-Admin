import { prisma } from "@/lib/db";

export const CAMP_START = "2026-07-08";
export const CAMP_END = "2026-07-18";
export const CAMP_TZ = "Africa/Addis_Ababa";

export function dateOnly(date: Date | string) {
  const value = typeof date === "string" ? date : date.toISOString();
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

export function campDayFor(date: Date | string) {
  const current = dateOnly(date).getTime();
  const start = dateOnly(CAMP_START).getTime();
  return Math.max(1, Math.floor((current - start) / 86400000) + 1);
}

export function campDayDisplay(date: Date | string, totalDays = 11) {
  return Math.min(totalDays, Math.max(1, campDayFor(date)));
}

export function isCampDate(date: Date | string) {
  const current = dateOnly(date).getTime();
  return current >= dateOnly(CAMP_START).getTime() && current <= dateOnly(CAMP_END).getTime();
}

export function todayInCampTimezone(timezone = CAMP_TZ) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
  return dateOnly(parts);
}

export async function ensureSettings() {
  return prisma.setting.upsert({
    where: { id: "camp" },
    update: {},
    create: {
      id: "camp",
      startDate: dateOnly(CAMP_START),
      endDate: dateOnly(CAMP_END),
      finalRequiredDate: dateOnly(CAMP_END)
    }
  });
}

export function activeMealFor(date = new Date(), timezone = CAMP_TZ) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      hour12: false
    }).format(date)
  );
  if (hour < 10) return "BREAKFAST";
  if (hour < 15) return "LUNCH";
  return "DINNER";
}

export const sessions = ["MORNING", "AFTERNOON"] as const;
export const meals = ["BREAKFAST", "LUNCH", "DINNER"] as const;
