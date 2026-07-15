"use client";

import { Download, Eye, Search, UserMinus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type Participant = {
  id: string;
  participantId: string;
  fullName: string;
  gender: string | null;
  church: string | null;
  phone: string | null;
  certificate: { eligible: boolean; attendancePercent: number };
};
type Team = { id: string; teamCode: string; name: string; description: string | null; leader: string | null; color: string | null; qr: string };
type TeamOption = { id: string; teamCode: string; name: string };

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export function TeamDetails({ team, participants, teams, availableParticipants }: { team: Team; participants: Participant[]; teams: TeamOption[]; availableParticipants: Array<Participant & { teamName: string | null }> }) {
  const [query, setQuery] = useState("");
  const [addQuery, setAddQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [targetTeamId, setTargetTeamId] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return participants.filter((participant) => `${participant.fullName} ${participant.participantId} ${participant.church ?? ""} ${participant.phone ?? ""}`.toLowerCase().includes(q));
  }, [participants, query]);
  const addMatches = useMemo(() => {
    const q = addQuery.toLowerCase();
    return availableParticipants
      .filter((participant) => `${participant.fullName} ${participant.participantId} ${participant.church ?? ""} ${participant.teamName ?? ""}`.toLowerCase().includes(q))
      .slice(0, 80);
  }, [addQuery, availableParticipants]);

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleAdd(id: string) {
    setSelectedToAdd((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function updateMembers(action: "remove" | "move", ids = selected) {
    if (!ids.length) return;
    if (action === "remove" && !window.confirm(`Remove ${ids.length} participant(s) from ${team.name}?`)) return;
    if (action === "move" && (!targetTeamId || !window.confirm(`Move ${ids.length} participant(s) to the selected team?`))) return;
    setPending(true);
    const response = await fetch(`/api/teams/${team.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, participantIds: ids, targetTeamId })
    });
    const result = await response.json();
    setPending(false);
    setMessage(result.ok ? "Team membership updated." : result.message);
    if (result.ok) {
      setSelected([]);
      window.dispatchEvent(new Event("yc:data-change"));
    }
  }

  async function addMembers() {
    if (!selectedToAdd.length) return;
    const moving = availableParticipants.filter((participant) => selectedToAdd.includes(participant.id) && participant.teamName);
    if (moving.length && !window.confirm(`${moving.length} selected participant(s) already belong to another team. Move them to ${team.name}?`)) return;
    setPending(true);
    const response = await fetch(`/api/teams/${team.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", participantIds: selectedToAdd })
    });
    const result = await response.json();
    setPending(false);
    setMessage(result.ok ? "Participants added to team." : result.message);
    if (result.ok) {
      setSelectedToAdd([]);
      window.dispatchEvent(new Event("yc:data-change"));
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start gap-5">
          <Image src={team.qr} alt={`${team.name} QR code`} width={180} height={180} className="rounded-2xl border border-slate-200" unoptimized />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 rounded-full" style={{ backgroundColor: team.color ?? "#4f46e5" }} />
              <h2 className="text-3xl font-black text-ink">{team.name}</h2>
            </div>
            <p className="mt-1 text-sm font-black uppercase text-royal">{team.teamCode}</p>
            {team.description ? <p className="mt-3 max-w-3xl text-sm font-semibold text-slate-600">{team.description}</p> : null}
            {team.leader ? <p className="mt-2 text-sm font-bold text-slate-500">Leader: {team.leader}</p> : null}
            <button className="btn btn-primary mt-5" onClick={() => downloadDataUrl(team.qr, `${team.teamCode}-${team.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-qr.png`)}>
              <Download className="h-4 w-4" />Download QR Code
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-6 rounded-2xl bg-slate-50 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-ink">Add Participants</h3>
              <p className="text-sm font-semibold text-slate-500">Search and select participants to assign or transfer into this team.</p>
            </div>
            <button className="btn btn-primary" disabled={pending || !selectedToAdd.length} onClick={addMembers}>Add Selected ({selectedToAdd.length})</button>
          </div>
          <label className="relative block max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="field pl-10" placeholder="Search participants to add" value={addQuery} onChange={(event) => setAddQuery(event.target.value)} />
          </label>
          <div className="mt-3 grid max-h-[260px] gap-2 overflow-auto pr-1 md:grid-cols-2">
            {addMatches.map((participant) => (
              <label key={participant.id} className="flex cursor-pointer items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
                <input type="checkbox" checked={selectedToAdd.includes(participant.id)} onChange={() => toggleAdd(participant.id)} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-black text-ink">{participant.fullName}</span>
                  <span className="block text-xs font-bold text-slate-500">{participant.participantId} - {participant.teamName ?? "No Team Assigned"}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-ink">Team Members</h3>
            <p className="text-sm font-semibold text-slate-500">{participants.length} assigned participants</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select className="field select-premium min-w-[220px]" value={targetTeamId} onChange={(event) => setTargetTeamId(event.target.value)}>
              <option value="">Move selected to...</option>
              {teams.filter((item) => item.id !== team.id).map((item) => <option key={item.id} value={item.id}>{item.teamCode} - {item.name}</option>)}
            </select>
            <button className="btn btn-secondary" disabled={pending || !selected.length || !targetTeamId} onClick={() => updateMembers("move")}>Move</button>
            <button className="btn btn-secondary text-red-700" disabled={pending || !selected.length} onClick={() => updateMembers("remove")}><UserMinus className="h-4 w-4" />Remove</button>
          </div>
        </div>
        <label className="relative block max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="field pl-10" placeholder="Search team members" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>{["", "Participant ID", "Name", "Gender", "Church", "Phone", "Attendance", "Certificate", "Actions"].map((head) => <th key={head} className="border-b border-slate-200 px-3 py-3">{head}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map((participant) => (
                <tr key={participant.id} className="border-b border-slate-100">
                  <td className="px-3 py-4"><input type="checkbox" checked={selected.includes(participant.id)} onChange={() => toggle(participant.id)} /></td>
                  <td className="px-3 py-4 font-black text-royal">{participant.participantId}</td>
                  <td className="px-3 py-4 font-black text-ink">{participant.fullName}</td>
                  <td className="px-3 py-4 font-bold text-slate-600">{participant.gender ?? "-"}</td>
                  <td className="px-3 py-4 font-bold text-slate-600">{participant.church ?? "-"}</td>
                  <td className="px-3 py-4 font-bold text-slate-600">{participant.phone ?? "-"}</td>
                  <td className="px-3 py-4 font-bold text-slate-600">{participant.certificate.attendancePercent}%</td>
                  <td className="px-3 py-4"><span className={`status ${participant.certificate.eligible ? "status-green" : "status-slate"}`}>{participant.certificate.eligible ? "Eligible" : "Not eligible"}</span></td>
                  <td className="px-3 py-4">
                    <div className="flex gap-2">
                      <Link className="btn btn-primary py-2" href={`/participants/${participant.id}`}><Eye className="h-4 w-4" />View</Link>
                      <button className="btn btn-secondary py-2 text-red-700" disabled={pending} onClick={() => updateMembers("remove", [participant.id])}><UserMinus className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length ? <p className="mt-4 text-sm font-semibold text-slate-500">No members match your search.</p> : null}
        {message ? <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">{message}</p> : null}
      </section>
    </div>
  );
}
