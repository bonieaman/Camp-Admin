"use client";

import {
  BadgeCheck,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MonitorUp,
  Settings,
  Soup,
  UsersRound,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { logoutAction } from "@/app/(admin)/actions";
import { roleLabel, type AdminRole } from "@/lib/rbac";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "MEAL_ADMIN", "ATTENDANCE_ADMIN"] },
  { href: "/participants", label: "Participants", icon: UsersRound, roles: ["SUPER_ADMIN"] },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck, roles: ["SUPER_ADMIN", "ATTENDANCE_ADMIN"] },
  { href: "/meals", label: "Meals", icon: Soup, roles: ["SUPER_ADMIN", "MEAL_ADMIN"] },
  { href: "/teams", label: "Teams", icon: UsersRound, roles: ["SUPER_ADMIN"] },
  { href: "/outreach", label: "Outreach", icon: Megaphone, roles: ["SUPER_ADMIN"] },
  { href: "/digital-evangelism", label: "Digital Evangelism", icon: MonitorUp, roles: ["SUPER_ADMIN"] },
  { href: "/certificates", label: "Certificates", icon: BadgeCheck, roles: ["SUPER_ADMIN"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["SUPER_ADMIN"] }
];

export function AdminShell({
  children,
  title,
  campLine,
  role
}: {
  children: React.ReactNode;
  title: string;
  campLine: string;
  role: AdminRole;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleNav = nav.filter((item) => item.roles.includes(role));
  const now = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Africa/Addis_Ababa",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date()),
    []
  );

  const Sidebar = (
    <aside className={`flex h-full flex-col border-r border-slate-200 bg-white ${collapsed ? "w-[92px]" : "w-[280px]"}`}>
      <div className="flex items-center gap-3 border-b border-slate-200 p-5">
        <Image src="/youth-camp-logo.png" alt="Youth Camp 2026" width={54} height={42} className="rounded-xl bg-white object-contain" />
        {!collapsed ? (
          <div>
            <p className="text-sm font-black text-ink">Youth Camp 2026</p>
            <p className="text-xs font-bold text-slate-500">Admin Console</p>
          </div>
        ) : null}
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                active ? "bg-royal text-white shadow-soft" : "text-slate-600 hover:bg-slate-100 hover:text-ink"
              }`}
              aria-label={item.label}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-4">
        <form action={logoutAction}>
          <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold text-slate-600 hover:bg-red-50 hover:text-red-700">
            <LogOut className="h-5 w-5" />
            {!collapsed ? <span>Logout</span> : null}
          </button>
        </form>
      </div>
    </aside>
  );

  return (
    <div className="admin-grid">
      <div className="hidden lg:block">{Sidebar}</div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden">
          <div className="h-full w-[82vw] max-w-[320px] bg-white">
            <button className="absolute right-5 top-5 rounded-full bg-white p-2 shadow-soft" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            {Sidebar}
          </div>
        </div>
      ) : null}
      <main className="min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur md:px-7">
          <div className="flex items-center gap-3">
            <button className="rounded-xl border border-slate-200 p-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <button className="hidden rounded-xl border border-slate-200 p-2 lg:inline-flex" onClick={() => setCollapsed((value) => !value)} aria-label="Toggle sidebar">
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
            <div>
              <h1 className="text-xl font-black text-ink md:text-2xl">{title}</h1>
              <p className="text-sm font-semibold text-slate-500">{campLine}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 sm:block">{now} EAT</div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-royal">{roleLabel(role)}</div>
          </div>
        </header>
        <div className="p-4 md:p-7">{children}</div>
      </main>
    </div>
  );
}
