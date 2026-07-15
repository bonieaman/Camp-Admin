"use client";

import { Download, Edit3, Eye, Plus, QrCode, Search, Trash2, UsersRound, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type Participant = { id: string; participantId: string; fullName: string; church: string | null; teamId: string | null; team: { name: string } | null };
type Team = {
  id: string;
  teamCode: string;
  name: string;
  description: string | null;
  leader: string | null;
  color: string | null;
  qr: string;
  participants: number;
  outreachStatus: string;
  digitalStatus: string;
};

function emptyForm() {
  return { name: "", description: "", leader: "", color: "#4f46e5", participantIds: [] as string[] };
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export function TeamsManager({ teams, participants }: { teams: Team[]; participants: Participant[] }) {
  const [form, setForm] = useState(emptyForm());
  const [creating, setCreating] = useState(false);
  const [participantQuery, setParticipantQuery] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);

  const participantMatches = useMemo(() => {
    const q = participantQuery.toLowerCase();
    return participants.filter((participant) => `${participant.fullName} ${participant.participantId} ${participant.church ?? ""}`.toLowerCase().includes(q));
  }, [participantQuery, participants]);

  function toggleParticipant(id: string) {
    setForm((current) => ({
      ...current,
      participantIds: current.participantIds.includes(id) ? current.participantIds.filter((item) => item !== id) : [...current.participantIds, id]
    }));
  }

  async function createTeam() {
    if (!form.name.trim()) return;
    const moving = participants.filter((participant) => form.participantIds.includes(participant.id) && participant.teamId);
    if (moving.length && !window.confirm(`${moving.length} selected participant(s) already belong to another team. Move them to this new team?`)) return;
    setPending(true);
    const response = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const result = await response.json();
    setPending(false);
    setMessage(result.ok ? "Team created." : result.message);
    if (result.ok) {
      setForm(emptyForm());
      setCreating(false);
      window.dispatchEvent(new Event("yc:data-change"));
    }
  }

  async function saveTeam() {
    if (!editing) return;
    setPending(true);
    const response = await fetch(`/api/teams/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing)
    });
    const result = await response.json();
    setPending(false);
    setMessage(result.ok ? "Team updated." : result.message);
    if (result.ok) {
      setEditing(null);
      window.dispatchEvent(new Event("yc:data-change"));
    }
  }

  async function deleteTeam(team: Team) {
    if (!window.confirm(`Delete ${team.name}? Members will be marked as having no team assigned.`)) return;
    setPending(true);
    const response = await fetch(`/api/teams/${team.id}`, { method: "DELETE" });
    const result = await response.json();
    setPending(false);
    setMessage(result.ok ? "Team deleted." : result.message);
    if (result.ok) window.dispatchEvent(new Event("yc:data-change"));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-ink">Team Management</h2>
            <p className="text-sm font-semibold text-slate-500">Create teams, assign participants, and print team QR codes.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setCreating((value) => !value)}><Plus className="h-4 w-4" />Create Team</button>
        </div>
        {creating ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,420px)_1fr]">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="grid gap-3">
                <input className="field" placeholder="Team name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                <textarea className="field min-h-24" placeholder="Description (optional)" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
                <input className="field" placeholder="Team leader (optional)" value={form.leader} onChange={(event) => setForm({ ...form, leader: event.target.value })} />
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600">
                  <span>Team color</span>
                  <input type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} className="h-9 w-12 rounded-lg border border-slate-200 bg-white" />
                </label>
              </div>
              <button className="btn btn-primary mt-4 w-full" disabled={pending || !form.name.trim()} onClick={createTeam}>
                {pending ? "Creating..." : "Save Team"}
              </button>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-black text-ink">Assign Participants</h3>
                <span className="status status-slate">{form.participantIds.length} selected</span>
              </div>
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input className="field pl-10" placeholder="Search participants" value={participantQuery} onChange={(event) => setParticipantQuery(event.target.value)} />
              </label>
              <div className="mt-3 max-h-[380px] space-y-2 overflow-auto pr-1">
                {participantMatches.map((participant) => (
                  <label key={participant.id} className="flex cursor-pointer items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
                    <input type="checkbox" checked={form.participantIds.includes(participant.id)} onChange={() => toggleParticipant(participant.id)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-black text-ink">{participant.fullName}</span>
                      <span className="block text-xs font-bold text-slate-500">{participant.participantId} - {participant.team?.name ?? "No Team Assigned"}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ) : null}
        {message ? <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">{message}</p> : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {teams.map((team) => (
          <article key={team.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <Image src={team.qr} alt={`${team.name} QR code`} width={112} height={112} className="rounded-xl border border-slate-200" unoptimized />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: team.color ?? "#4f46e5" }} />
                  <p className="truncate text-lg font-black text-ink">{team.name}</p>
                </div>
                <p className="text-sm font-bold text-royal">{team.teamCode}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">{team.participants} participants</p>
                {team.leader ? <p className="text-sm font-semibold text-slate-500">Leader: {team.leader}</p> : null}
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"><span className="font-bold text-slate-500">Outreach</span><span className="font-black text-ink">{team.outreachStatus}</span></div>
              <div className="flex justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"><span className="font-bold text-slate-500">Digital</span><span className="font-black text-ink">{team.digitalStatus}</span></div>
            </div>
            {editing?.id === team.id ? (
              <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-black text-ink">Edit Team</p>
                  <button className="rounded-lg p-2 hover:bg-white" onClick={() => setEditing(null)} aria-label="Close edit form"><X className="h-4 w-4" /></button>
                </div>
                <input className="field" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} />
                <input className="field" value={editing.leader ?? ""} placeholder="Leader" onChange={(event) => setEditing({ ...editing, leader: event.target.value })} />
                <textarea className="field min-h-20" value={editing.description ?? ""} placeholder="Description" onChange={(event) => setEditing({ ...editing, description: event.target.value })} />
                <input type="color" value={editing.color ?? "#4f46e5"} onChange={(event) => setEditing({ ...editing, color: event.target.value })} className="h-10 w-16 rounded-lg border border-slate-200 bg-white" />
                <button className="btn btn-primary" disabled={pending} onClick={saveTeam}>Save Changes</button>
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="btn btn-primary py-2" href={`/teams/${team.id}`}><Eye className="h-4 w-4" />Details</Link>
              <button className="btn btn-secondary py-2" onClick={() => downloadDataUrl(team.qr, `${team.teamCode}-${team.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-qr.png`)}><Download className="h-4 w-4" /><QrCode className="h-4 w-4" /></button>
              <button className="btn btn-secondary py-2" onClick={() => setEditing(team)}><Edit3 className="h-4 w-4" /></button>
              <button className="btn btn-secondary py-2 text-red-700" onClick={() => deleteTeam(team)}><Trash2 className="h-4 w-4" /></button>
            </div>
          </article>
        ))}
        {!teams.length ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm lg:col-span-2 2xl:col-span-3">
            <UsersRound className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-3 text-lg font-black text-ink">No teams yet</p>
            <p className="text-sm font-semibold text-slate-500">Create the first team and assign participants when ready.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
