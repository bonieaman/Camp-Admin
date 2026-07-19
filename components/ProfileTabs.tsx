"use client";

import { Download } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { createChallengeRecord, deleteChallengeRecord, toggleCheckIn, updateParticipantTeam } from "@/app/(admin)/actions";

type Row = { id: string; campDay: number; session?: string; meal?: string; challenge?: string; scannedAt?: Date | string; completedAt?: Date | string };

export function ProfileTabs({
  participant,
  qr,
  teams
}: {
  participant: any;
  qr: string;
  teams: { id: string; teamCode?: string; name: string }[];
}) {
  const [tab, setTab] = useState("Overview");
  const tabs = ["Overview", "Attendance", "Meals", "Outreach", "Digital Evangelism", "Certificate"];

  function downloadQr() {
    const link = document.createElement("a");
    link.href = qr;
    link.download = `${participant.participantId}-${participant.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-qr.png`;
    link.click();
  }

  const status = participant.certificate;
  const recordList = (records: Row[], kind: "attendance" | "meal" | "outreach" | "challenge") => (
    <div className="grid gap-3">
      {records.map((record) => (
        <div key={record.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
          <div>
            <p className="font-black text-ink">Day {record.campDay}</p>
            <p className="text-sm font-semibold text-slate-500">{record.session ?? record.meal ?? record.challenge ?? kind}</p>
          </div>
          <span className="status status-green">Recorded</span>
        </div>
      ))}
      {!records.length ? <p className="text-sm font-semibold text-slate-500">No records yet.</p> : null}
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
          <Image src={qr} alt={`${participant.fullName} QR code`} width={260} height={260} className="mx-auto rounded-2xl border border-slate-200" unoptimized />
          <button className="btn btn-primary mt-4 w-full" onClick={downloadQr}><Download className="h-4 w-4" />Download QR Code</button>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase text-royal">{participant.participantId}</p>
              <h2 className="mt-1 text-3xl font-black text-ink">{participant.fullName}</h2>
              <p className="mt-2 text-sm font-bold text-slate-500">{participant.church ?? "Church not listed"} - {participant.gender ?? "Gender not listed"}</p>
            </div>
            <span className={`status ${status.eligible ? "status-green" : "status-amber"}`}>{status.eligible ? "Certificate eligible" : "Not yet eligible"}</span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Age", participant.age ?? "-"],
              ["Phone", participant.phone ?? "-"],
              ["Registration", participant.registrationStatus],
              ["Team", participant.team ? participant.team.name : "No Team Assigned"],
              ["Team ID", participant.team?.teamCode ?? "-"],
              ["Check-in", participant.checkedIn ? "Checked in" : "Pending"],
              ["Check-in time", participant.checkedInAt ? new Date(participant.checkedInAt).toLocaleString() : "-"]
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase text-slate-500">{label}</p>
                <p className="mt-1 font-black text-ink">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="btn btn-secondary" onClick={() => toggleCheckIn(participant.id, !participant.checkedIn)}>
              {participant.checkedIn ? "Undo check-in" : "Mark checked in"}
            </button>
            <select className="field select-premium max-w-xs" value={participant.teamId ?? ""} onChange={(e) => updateParticipantTeam(participant.id, e.target.value)}>
              <option value="">No Team Assigned</option>
              {teams.map((team) => <option key={team.id} value={team.id}>{team.teamCode ? `${team.teamCode} - ${team.name}` : team.name}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button key={item} className={`btn py-2 ${tab === item ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab(item)}>{item}</button>
          ))}
        </div>
        {tab === "Overview" ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["Attendance days", status.attendedDays],
              ["Attendance percent", `${status.attendancePercent}%`],
              ["Meals served", status.mealsServed],
              ["Outreach days", status.outreachDays]
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-black text-ink">{value}</p>
              </div>
            ))}
          </div>
        ) : null}
        {tab === "Attendance" ? recordList(participant.attendanceRecords, "attendance") : null}
        {tab === "Meals" ? recordList(participant.mealRecords, "meal") : null}
        {tab === "Outreach" ? recordList(participant.outreachRecords, "outreach") : null}
        {tab === "Digital Evangelism" ? (
          <div className="space-y-4">
            <form action={createChallengeRecord} className="grid gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-[1fr_180px_auto]">
              <input type="hidden" name="participantId" value={participant.id} />
              <input className="field" name="challenge" placeholder="Challenge name" />
              <input className="field" name="date" type="date" defaultValue="2026-07-15" />
              <button className="btn btn-primary">Add</button>
            </form>
            <div className="grid gap-3">
              {participant.challengeRecords.map((record: Row) => (
                <div key={record.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-black text-ink">Day {record.campDay}</p>
                    <p className="text-sm font-semibold text-slate-500">{record.challenge}</p>
                  </div>
                  <form action={deleteChallengeRecord} onSubmit={(event) => { if (!window.confirm("Delete this challenge record?")) event.preventDefault(); }}>
                    <input type="hidden" name="id" value={record.id} />
                    <input type="hidden" name="participantId" value={participant.id} />
                    <button className="btn btn-secondary py-2 text-red-700">Delete</button>
                  </form>
                </div>
              ))}
              {!participant.challengeRecords.length ? <p className="text-sm font-semibold text-slate-500">No records yet.</p> : null}
            </div>
          </div>
        ) : null}
        {tab === "Certificate" ? (
          <div>
            <p className="mb-3 text-lg font-black text-ink">{status.eligible ? "Participant is certificate eligible." : "Remaining requirements"}</p>
            <div className="grid gap-3">
              {status.missing.length ? status.missing.map((item: string) => <div key={item} className="rounded-xl bg-amber-50 px-4 py-3 font-bold text-amber-800">{item}</div>) : <div className="rounded-xl bg-green-50 px-4 py-3 font-bold text-green-700">All requirements satisfied.</div>}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
