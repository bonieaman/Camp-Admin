export const ADMIN_ROLES = ["SUPER_ADMIN", "MEAL_ADMIN", "ATTENDANCE_ADMIN"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export type AdminSession = {
  directorId: string;
  role: AdminRole;
};

const pageAccess: Record<AdminRole, string[]> = {
  SUPER_ADMIN: [
    "/dashboard",
    "/participants",
    "/attendance",
    "/meals",
    "/teams",
    "/outreach",
    "/digital-evangelism",
    "/attendance-percentage",
    "/attendance-meal-reports",
    "/certificates",
    "/settings"
  ],
  MEAL_ADMIN: ["/dashboard", "/meals"],
  ATTENDANCE_ADMIN: ["/dashboard", "/attendance"]
};

const apiAccess: Record<AdminRole, string[]> = {
  SUPER_ADMIN: ["/api"],
  MEAL_ADMIN: ["/api/meals", "/api/participants/lookup"],
  ATTENDANCE_ADMIN: ["/api/attendance", "/api/participants/lookup"]
};

export function canAccessPath(role: AdminRole, pathname: string) {
  if (pathname === "/" || pathname === "/login" || pathname === "/403") return true;
  const access = pathname.startsWith("/api") ? apiAccess[role] : pageAccess[role];
  return access.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function roleLabel(role: AdminRole) {
  if (role === "MEAL_ADMIN") return "Meal Admin";
  if (role === "ATTENDANCE_ADMIN") return "Attendance Admin";
  return "SuperAdmin";
}
