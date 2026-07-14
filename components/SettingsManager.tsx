"use client";

import { Trash2 } from "lucide-react";
import { createTeam, deleteTeam, updateSettings, updateTeam } from "@/app/(admin)/actions";

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

type Team = { id: string; name: string; _count: { participants: number } };

function ymd(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function SettingsManager({ settings, teams }: { settings: Settings; teams: Team[] }) {
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
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-ink">Teams</h2>
        <form action={createTeam} className="mt-4 flex gap-3">
          <input name="name" className="field" placeholder="Create team" />
          <button className="btn btn-primary">Create</button>
        </form>
        <div className="mt-5 space-y-3">
          {teams.map((team) => (
            <div key={team.id} className="rounded-xl bg-slate-50 p-3">
              <form action={updateTeam} className="flex flex-wrap items-center gap-3">
                <input type="hidden" name="id" value={team.id} />
                <input className="field min-w-0 flex-1" name="name" defaultValue={team.name} />
                <span className="status status-slate">{team._count.participants} participants</span>
                <button className="btn btn-secondary py-2">Save</button>
              </form>
              <form
                action={deleteTeam}
                className="mt-2"
                onSubmit={(event) => {
                  if (!window.confirm(`Delete team ${team.name}? Participants will become unassigned.`)) event.preventDefault();
                }}
              >
                <input type="hidden" name="id" value={team.id} />
                <button className="btn btn-secondary py-2 text-red-700"><Trash2 className="h-4 w-4" />Delete Team</button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
