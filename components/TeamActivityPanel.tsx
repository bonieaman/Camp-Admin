"use client";

import { Camera, CheckCircle2, ScanLine, UsersRound } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

type Team = { id: string; name: string; _count: { participants: number } };
type History = { id: string; activityDate: Date | string; recordedAt: Date | string; recordedBy: string | null; team: Team };
type ActivityType = "OUTREACH" | "DIGITAL_EVANGELISM";

type VerifiedTeam = {
  id: string;
  name: string;
  participants: number;
};

export function TeamActivityPanel({
  title,
  activityType,
  confirmLabel,
  teams,
  history,
  today
}: {
  title: string;
  activityType: ActivityType;
  confirmLabel: string;
  teams: Team[];
  history: History[];
  today: string;
}) {
  const scannerId = useId().replaceAll(":", "");
  const scannerRef = useRef<any>(null);
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [date, setDate] = useState(today);
  const [verified, setVerified] = useState<VerifiedTeam | null>(null);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [payload, setPayload] = useState("");
  const [pending, setPending] = useState(false);
  const [scanning, setScanning] = useState(false);

  async function stopScanner() {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      await scanner.stop?.();
      await scanner.clear?.();
    } catch {
      // Camera teardown may race with route changes.
    } finally {
      scannerRef.current = null;
      setScanning(false);
    }
  }

  async function verify(decodedPayload: string) {
    setPending(true);
    setMessage("");
    setVerified(null);
    const response = await fetch("/api/team-activity/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: decodedPayload, teamId, date, activityType })
    });
    const result = await response.json();
    setPending(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setPayload(decodedPayload);
    setVerified(result.team);
    setStatus(result.status);
  }

  async function record() {
    if (!verified) return;
    setPending(true);
    const response = await fetch("/api/team-activity/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: verified.id, date, activityType })
    });
    const result = await response.json();
    setPending(false);
    setMessage(result.message);
    if (result.ok) {
      setVerified(null);
      setPayload("");
      window.dispatchEvent(new Event("yc:data-change"));
    }
  }

  async function start() {
    await stopScanner();
    setScanning(true);
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;
    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 260, height: 260 } },
      async (decoded: string) => {
        await stopScanner();
        await verify(decoded);
      },
      undefined
    );
  }

  useEffect(() => {
    setVerified(null);
    setStatus("");
    setPayload("");
  }, [teamId, date, activityType]);

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, []);

  const selectedTeam = teams.find((team) => team.id === teamId);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-ink">{title}</h2>
            <p className="text-sm font-semibold text-slate-500">Select a team, scan its QR code, then confirm the record.</p>
          </div>
          <ScanLine className="h-7 w-7 text-royal" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-600">Date</span>
            <input type="date" className="field" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-600">Team</span>
            <select className="field select-premium" value={teamId} onChange={(event) => setTeamId(event.target.value)}>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div id={scannerId} className="min-h-[320px] overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50" />
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-royal shadow-sm">
                <UsersRound className="h-6 w-6" />
              </div>
              <div>
                <p className="font-black text-ink">{selectedTeam?.name ?? "No team selected"}</p>
                <p className="text-sm font-bold text-slate-500">{selectedTeam?._count.participants ?? 0} participants</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="btn btn-primary" onClick={start} disabled={!teamId || scanning || pending}>
                <Camera className="h-4 w-4" />
                {scanning ? "Scanning..." : "Start Camera"}
              </button>
              <button className="btn btn-secondary" onClick={stopScanner}>Stop</button>
            </div>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-black text-slate-600">Manual QR payload</span>
              <textarea className="field min-h-24" value={payload} onChange={(event) => setPayload(event.target.value)} placeholder="YC2026TEAM:team-id:secure-token" />
            </label>
            <button className="btn btn-secondary mt-3 w-full" disabled={pending || !payload || !teamId} onClick={() => verify(payload)}>
              Verify Team
            </button>
          </div>
        </div>
      </section>
      <aside className="space-y-5">
        {verified ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black text-ink">Confirm Team</h3>
            <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between gap-3"><span className="font-bold text-slate-500">Team</span><span className="font-black text-ink">{verified.name}</span></div>
              <div className="flex justify-between gap-3"><span className="font-bold text-slate-500">Participants</span><span className="font-black text-ink">{verified.participants}</span></div>
              <div className="flex justify-between gap-3"><span className="font-bold text-slate-500">Status</span><span className="font-black text-ink">{status}</span></div>
            </div>
            <button className="btn btn-primary mt-5 w-full py-4" disabled={pending || status === "Recorded"} onClick={record}>
              <CheckCircle2 className="h-5 w-5" />
              {confirmLabel}
            </button>
          </section>
        ) : null}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-ink">Recently Recorded</h3>
          <div className="mt-4 space-y-3">
            {history.map((item) => (
              <div key={item.id} className="rounded-xl bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-ink">{item.team.name}</p>
                  <span className="status status-green">Recorded</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {new Date(item.activityDate).toLocaleDateString()} - {new Date(item.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className="text-xs font-bold text-slate-500">Recorded by {item.recordedBy ?? "System"}</p>
              </div>
            ))}
            {!history.length ? <p className="text-sm font-semibold text-slate-500">No records yet.</p> : null}
          </div>
        </section>
        {message ? <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">{message}</p> : null}
      </aside>
    </div>
  );
}
