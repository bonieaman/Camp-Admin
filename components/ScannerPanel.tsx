"use client";

import { Camera, CheckCircle2, Keyboard, ScanLine, UserRound } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

type VerifiedParticipant = {
  dbId: string;
  id: string;
  name: string;
  team: string;
  church: string;
  gender: string;
  photoUrl: string | null;
};

export function ScannerPanel({
  title,
  endpoint,
  controls,
  manualMode = "qr",
  action = "attendance",
  confirmLabel = "Record"
}: {
  title: string;
  endpoint: string;
  controls: React.ReactNode;
  manualMode?: "qr" | "participant-number";
  action?: "attendance" | "meal";
  confirmLabel?: string;
}) {
  const id = useId().replaceAll(":", "");
  const scannerRef = useRef<any>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [payload, setPayload] = useState("");
  const [lookupValue, setLookupValue] = useState<{ value: string; kind: "qr" | "manual" } | null>(null);
  const [verified, setVerified] = useState<VerifiedParticipant | null>(null);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [scanning, setScanning] = useState(false);
  const [pending, setPending] = useState(false);

  function formData() {
    return Object.fromEntries(new FormData(formRef.current ?? undefined));
  }

  async function stopScanner() {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      await scanner.stop?.();
      await scanner.clear?.();
    } catch {
      // The scanner may already be stopped when switching routes.
    } finally {
      scannerRef.current = null;
      setScanning(false);
    }
  }

  async function lookup(value: string, kind: "qr" | "manual" = "qr") {
    const data = formData();
    const body = kind === "manual" && manualMode === "participant-number" ? { ...data, action, participantCode: value } : { ...data, action, payload: value };
    setPending(true);
    setMessage("");
    setVerified(null);
    const response = await fetch("/api/participants/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    setPending(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setLookupValue({ value, kind });
    setVerified(result.participant);
    setStatus(result.status);
  }

  async function confirmRecord() {
    if (!lookupValue) return;
    const data = formData();
    const body =
      lookupValue.kind === "manual" && manualMode === "participant-number"
        ? { ...data, participantCode: lookupValue.value }
        : { ...data, payload: lookupValue.value };
    setPending(true);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    setPending(false);
    setMessage(result.participant ? `${result.message} ${result.participant.name} (${result.participant.id})` : result.message);
    if (result.ok) {
      setVerified(null);
      setLookupValue(null);
      setPayload("");
      window.dispatchEvent(new Event("yc:data-change"));
    }
  }

  async function start() {
    await stopScanner();
    setScanning(true);
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode(id);
    scannerRef.current = scanner;
    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 260, height: 260 } },
      async (decoded: string) => {
        await stopScanner();
        await lookup(decoded, "qr");
      },
      undefined
    );
  }

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, []);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-ink">{title}</h2>
            <p className="text-sm font-semibold text-slate-500">Scan the printed participant badge QR code, then confirm before recording.</p>
          </div>
          <ScanLine className="h-7 w-7 text-royal" />
        </div>
        <div id={id} className="min-h-[320px] overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50" />
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="btn btn-primary" onClick={start} disabled={scanning || pending}>
            <Camera className="h-4 w-4" />
            {scanning ? "Scanning..." : "Start Camera"}
          </button>
          <button className="btn btn-secondary" onClick={stopScanner}>
            Stop
          </button>
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form ref={formRef} className="space-y-4">
          {controls}
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-600">{manualMode === "participant-number" ? "Participant number" : "Manual QR payload"}</span>
            {manualMode === "participant-number" ? (
              <input className="field" inputMode="numeric" value={payload} onChange={(e) => setPayload(e.target.value)} placeholder="15" />
            ) : (
              <textarea className="field min-h-28" value={payload} onChange={(e) => setPayload(e.target.value)} placeholder="YC2026:YC-2026-001:secure-token" />
            )}
          </label>
        </form>
        <button className="btn btn-secondary mt-3 w-full" disabled={pending || !payload} onClick={() => lookup(payload, "manual")}>
          <Keyboard className="h-4 w-4" />
          Verify Participant
        </button>
        {verified ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-royal shadow-sm">
                <UserRound className="h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-black text-ink">{verified.name}</p>
                <p className="text-sm font-bold text-royal">{verified.id}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-3"><span className="font-bold text-slate-500">Team</span><span className="font-black text-ink">{verified.team}</span></div>
              <div className="flex justify-between gap-3"><span className="font-bold text-slate-500">Church</span><span className="font-black text-ink">{verified.church}</span></div>
              <div className="flex justify-between gap-3"><span className="font-bold text-slate-500">{action === "meal" ? "Meal status" : "Attendance status"}</span><span className="font-black text-ink">{status}</span></div>
            </div>
            <button className="btn btn-primary mt-5 w-full py-4" disabled={pending} onClick={confirmRecord}>
              <CheckCircle2 className="h-5 w-5" />
              {confirmLabel}
            </button>
          </div>
        ) : null}
        {message ? <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">{message}</p> : null}
      </section>
    </div>
  );
}
