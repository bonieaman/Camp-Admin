"use client";

import { Download, Eye, QrCode, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type Participant = {
  id: string;
  participantId: string;
  fullName: string;
  phone: string | null;
  church: string | null;
  gender: string | null;
  checkedIn: boolean;
  checkedInAt?: Date | string | null;
  team: { name: string } | null;
  certificate: { eligible: boolean };
};

function uniq(values: (string | null | undefined)[]) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort();
}

export function ParticipantsTable({ participants }: { participants: Participant[] }) {
  const [query, setQuery] = useState("");
  const [team, setTeam] = useState("");
  const [church, setChurch] = useState("");
  const [gender, setGender] = useState("");
  const [checkedIn, setCheckedIn] = useState("");
  const [eligible, setEligible] = useState("");
  const [page, setPage] = useState(1);

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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>{["Participant ID", "Full Name", "Team", "Church", "Gender", "Check-in", "Certificate", "QR Code", "Profile"].map((h) => <th key={h} className="border-b border-slate-200 px-3 py-3">{h}</th>)}</tr>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm font-bold text-slate-600">
        <span>{filtered.length} participants</span>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary py-2" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
          <span>Page {page} of {pages}</span>
          <button className="btn btn-secondary py-2" disabled={page === pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}>Next</button>
        </div>
      </div>
    </div>
  );
}
