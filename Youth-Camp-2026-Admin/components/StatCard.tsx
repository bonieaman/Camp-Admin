import type { LucideIcon } from "lucide-react";

export function StatCard({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail?: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-ink">{value}</p>
        </div>
        <div className="rounded-2xl bg-royal/10 p-3 text-royal">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {detail ? <p className="mt-3 text-sm font-semibold text-slate-500">{detail}</p> : null}
    </div>
  );
}
