"use client";

import { BadgeCheck, IdCard } from "lucide-react";
import { useState } from "react";

export function CheckInParticipant() {
  const [participantCode, setParticipantCode] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function checkIn() {
    if (!participantCode.trim()) return;
    setPending(true);
    const response = await fetch("/api/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantCode })
    });
    const result = await response.json();
    setPending(false);
    setMessage(result.participant ? `${result.message} ${result.participant.name} (${result.participant.id})` : result.message);
    if (result.ok) {
      setParticipantCode("");
      window.dispatchEvent(new Event("yc:data-change"));
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-black text-ink">Participant Check-In</h2>
          <p className="text-sm font-semibold text-slate-500">Record first arrival using only the numeric participant ID.</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-royal/10 text-royal">
          <BadgeCheck className="h-6 w-6" />
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <IdCard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="field pl-11"
            inputMode="numeric"
            placeholder="15"
            value={participantCode}
            onChange={(event) => setParticipantCode(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") checkIn();
            }}
          />
        </label>
        <button className="btn btn-primary justify-center sm:min-w-[140px]" disabled={pending || !participantCode.trim()} onClick={checkIn}>
          {pending ? "Checking in..." : "Check In"}
        </button>
      </div>
      {message ? <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">{message}</p> : null}
    </div>
  );
}
