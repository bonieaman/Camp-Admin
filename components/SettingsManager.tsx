"use client";

import { updateSettings } from "@/app/(admin)/actions";

type Settings = {
  campName: string;
  startDate: Date | string;
  endDate: Date | string;
  totalDays: number;
  timezone: string;
  participantIdPrefix: string;
  finalRequiredDate: Date | string;
  finalRequiredSession: string;
};

function ymd(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function SettingsManager({ settings }: { settings: Settings }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-ink">Camp Settings</h2>
        <form action={updateSettings} className="mt-5 grid gap-3 md:grid-cols-2">
          <input name="campName" className="field md:col-span-2" defaultValue={settings.campName} placeholder="Camp name" />
          <input name="startDate" type="date" className="field" defaultValue={ymd(settings.startDate)} />
          <input name="endDate" type="date" className="field" defaultValue={ymd(settings.endDate)} />
          <input name="totalDays" className="field" inputMode="numeric" defaultValue={settings.totalDays} />
          <input name="timezone" className="field" defaultValue={settings.timezone} />
          <input name="participantIdPrefix" className="field" defaultValue={settings.participantIdPrefix} />
          <input name="finalRequiredDate" type="date" className="field" defaultValue={ymd(settings.finalRequiredDate)} />
          <select name="finalRequiredSession" className="field select-premium" defaultValue={settings.finalRequiredSession}>
            <option>MORNING</option>
            <option>AFTERNOON</option>
          </select>
          <button className="btn btn-primary md:col-span-2">Save Settings</button>
        </form>
      </section>
    </div>
  );
}
