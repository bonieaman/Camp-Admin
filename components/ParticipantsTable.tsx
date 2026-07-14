"use client";

import { Download, Edit3, Eye, Plus, QrCode, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type Participant = {
  id: string;
  participantId: string;
  fullName: string;
  fatherName?: string | null;
  age?: number | null;
  phone: string | null;
  church: string | null;
  gender: string | null;
  registrationStatus?: string | null;
  checkedIn: boolean;
  checkedInAt?: Date | string | null;
  teamId?: string | null;
  team: { id?: string; name: string } | null;
  certificate: { eligible: boolean };
};

type Team = { id: string; name: string };
type FormState = Partial<Participant> & { mode: "create" | "edit" };

function uniq(values: (string | null | undefined)[]) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort();
}

function emptyForm(): FormState {
  return { mode: "create", fullName: "", fatherName: "", age: null, phone: "", church: "", gender: "", teamId: "", registrationStatus: "Registered" };
}

export function ParticipantsTable({ participants, teams }: { participants: Participant[]; teams: Team[] }) {
  const [query, setQuery] = useState("");
  const [team, setTeam] = useState("");
  const [church, setChurch] = useState("");
  const [gender, setGender] = useState("");
  const [checkedIn, setCheckedIn] = useState("");
  const [eligible, setEligible] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<FormState | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return participants.filter((p) => {
      const text = `${p.fullName} ${p.participantId} ${p.phone ?? ""}`.toLowerCase();
      return (
        text.includes(q) &&
        (!team || p.team?.name === team) &&
        (!church || p.church === church) &&
        (!gender || p.gender === gender) &&
        (!checkedIn || String(p.checkedIn) === checkedIn) &&
        (!eligible || String(p.certificate.eligible) === eligible)
      );
    });
  }, [checkedIn, church, eligible, gender, participants, query, team]);
  const pages = Math.max(1, Math.ceil(filtered.length / 25));
  const pageItems = filtered.slice((page - 1) * 25, page * 25);

  async function downloadQr(participant: Participant) {
    const response = await fetch(`/api/participants/${participant.id}/qr`);
    const { dataUrl } = await response.json();
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${participant.participantId}-${participant.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-qr.png`;
    link.click();
  }

  function edit(participant: Participant) {
    setForm({ ...participant, mode: "edit", teamId: participant.teamId ?? participant.team?.id ?? "" });
  }

  async function save() {
    if (!form?.fullName) return;
    setPending(true);
    const endpoint = form.mode === "edit" ? `/api/participants/${form.id}` : "/api/participants";
    const response = await fetch(endpoint, {
      method: form.mode === "edit" ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const result = await response.json();
    setPending(false);
    setMessage(result.ok ? "Participant saved." : result.message);
    if (result.ok) {
      setForm(null);
      window.dispatchEvent(new Event("yc:data-change"));
    }
  }

  async function remove(participant: Participant) {
    if (!window.confirm(`Delete ${participant.fullName}? This will remove related attendance, meal, outreach, and challenge records.`)) return;
    setPending(true);
    const response = await fetch(`/api/participants/${participant.id}`, { method: "DELETE" });
    const result = await response.json();
    setPending(false);
    setMessage(result.ok ? "Participant deleted." : result.message);
    if (result.ok) window.dispatchEvent(new Event("yc:data-change"));
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-ink">Participant Directory</h2>
          <p className="text-sm font-semibold text-slate-500">Create, edit, delete, search, filter, and review participants.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setForm(emptyForm())}>
          <Plus className="h-4 w-4" />
          New Participant
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <label className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="field pl-10" placeholder="Search name, ID, or phone" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
        </label>
        {[
          ["Team", team, setTeam, uniq(participants.map((p) => p.team?.name))],
          ["Church", church, setChurch, uniq(participants.map((p) => p.church))],
          ["Gender", gender, setGender, uniq(participants.map((p) => p.gender))]
        ].map(([label, value, setter, values]) => (
          <select key={label as string} className="field select-premium" value={value as string} onChange={(e) => { (setter as (value: string) => void)(e.target.value); setPage(1); }}>
            <option value="">{label as string}: All</option>
            {(values as string[]).map((item) => <option key={item}>{item}</option>)}
          </select>
        ))}
        <select className="field select-premium" value={checkedIn} onChange={(e) => setCheckedIn(e.target.value)}>
          <option value="">Check-in: All</option>
          <option value="true">Checked in</option>
          <option value="false">Pending</option>
        </select>
        <select className="field select-premium" value={eligible} onChange={(e) => setEligible(e.target.value)}>
          <option value="">Certificate: All</option>
          <option value="true">Eligible</option>
          <option value="false">Not eligible</option>
        </select>
      </div>
      {form ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-black text-ink">{form.mode === "edit" ? `Edit ${form.participantId}` : "Create Participant"}</h3>
            <button className="rounded-xl p-2 hover:bg-white" onClick={() => setForm(null)} aria-label="Close form"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input className="field" placeholder="Full name" value={form.fullName ?? ""} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <input className="field" placeholder="Father name" value={form.fatherName ?? ""} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} />
            <input className="field" placeholder="Age" inputMode="numeric" value={form.age ?? ""} onChange={(e) => setForm({ ...form, age: Number(e.target.value) || null })} />
            <input className="field" placeholder="Phone" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="field" placeholder="Church" value={form.church ?? ""} onChange={(e) => setForm({ ...form, church: e.target.value })} />
            <select className="field select-premium" value={form.gender ?? ""} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">Gender</option>
              <option>Female</option>
              <option>Male</option>
            </select>
            <select className="field select-premium" value={form.teamId ?? ""} onChange={(e) => setForm({ ...form, teamId: e.target.value })}>
              <option value="">Unassigned</option>
              {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
            <input className="field" placeholder="Registration status" value={form.registrationStatus ?? ""} onChange={(e) => setForm({ ...form, registrationStatus: e.target.value })} />
          </div>
          <button className="btn btn-primary mt-4" disabled={pending} onClick={save}>{pending ? "Saving..." : "Save Participant"}</button>
        </div>
      ) : null}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>{["Participant ID", "Full Name", "Team", "Church", "Gender", "Check-in", "Certificate", "QR Code", "Profile", "Actions"].map((h) => <th key={h} className="border-b border-slate-200 px-3 py-3">{h}</th>)}</tr>
          </thead>
          <tbody>
            {pageItems.map((p) => (
              <tr key={p.id} className="border-b border-slate-100">
                <td className="px-3 py-4 font-black text-royal">{p.participantId}</td>
                <td className="px-3 py-4 font-black text-ink">{p.fullName}</td>
                <td className="px-3 py-4 font-bold text-slate-600">{p.team?.name ?? "Unassigned"}</td>
                <td className="px-3 py-4 font-bold text-slate-600">{p.church ?? "-"}</td>
                <td className="px-3 py-4 font-bold text-slate-600">{p.gender ?? "-"}</td>
                <td className="px-3 py-4"><span className={`status ${p.checkedIn ? "status-green" : "status-amber"}`}>{p.checkedIn ? "Checked in" : "Pending"}</span></td>
                <td className="px-3 py-4"><span className={`status ${p.certificate.eligible ? "status-green" : "status-slate"}`}>{p.certificate.eligible ? "Eligible" : "Not eligible"}</span></td>
                <td className="px-3 py-4"><button className="btn btn-secondary py-2" onClick={() => downloadQr(p)}><Download className="h-4 w-4" /><QrCode className="h-4 w-4" /></button></td>
                <td className="px-3 py-4"><Link className="btn btn-primary py-2" href={`/participants/${p.id}`}><Eye className="h-4 w-4" />View</Link></td>
                <td className="px-3 py-4">
                  <div className="flex gap-2">
                    <button className="btn btn-secondary py-2" onClick={() => edit(p)}><Edit3 className="h-4 w-4" /></button>
                    <button className="btn btn-secondary py-2 text-red-700" onClick={() => remove(p)}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-slate-600">
        <span>{filtered.length} participants</span>
        {message ? <span className="rounded-xl bg-slate-100 px-3 py-2">{message}</span> : null}
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary py-2" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
          <span>Page {page} of {pages}</span>
          <button className="btn btn-secondary py-2" disabled={page === pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}>Next</button>
        </div>
      </div>
    </div>
  );
}
