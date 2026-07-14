"use client";

import { Camera, Keyboard, ScanLine } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export function ScannerPanel({
  title,
  endpoint,
  controls,
  manualMode = "qr"
}: {
  title: string;
  endpoint: string;
  controls: React.ReactNode;
  manualMode?: "qr" | "participant-number";
}) {
  const id = useId().replaceAll(":", "");
  const scannerRef = useRef<any>(null);
  const [payload, setPayload] = useState("");
  const [message, setMessage] = useState("");
  const [scanning, setScanning] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(value: string, kind: "qr" | "manual" = "qr") {
    const form = document.querySelector<HTMLFormElement>("#scan-form");
    const data = Object.fromEntries(new FormData(form ?? undefined));
    const body = kind === "manual" && manualMode === "participant-number" ? { ...data, participantCode: value } : { ...data, payload: value };
    setPending(true);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    setPending(false);
    setMessage(result.participant ? `${result.message} ${result.participant.name} (${result.participant.id})` : result.message);
    if (result.ok) window.dispatchEvent(new Event("yc:data-change"));
  }

  async function start() {
    setScanning(true);
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode(id);
    scannerRef.current = scanner;
    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 260, height: 260 } },
      async (decoded: string) => {
        await scanner.stop();
        setScanning(false);
        await submit(decoded, "qr");
      },
      undefined
    );
  }

  useEffect(() => {
    return () => {
      scannerRef.current?.stop?.().catch(() => undefined);
    };
  }, []);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-ink">{title}</h2>
            <p className="text-sm font-semibold text-slate-500">Scan the printed participant badge QR code.</p>
          </div>
          <ScanLine className="h-7 w-7 text-royal" />
        </div>
        <div id={id} className="min-h-[320px] overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50" />
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="btn btn-primary" onClick={start} disabled={scanning || pending}><Camera className="h-4 w-4" />{scanning ? "Scanning..." : "Start Camera"}</button>
          <button className="btn btn-secondary" onClick={() => scannerRef.current?.stop?.().then(() => setScanning(false))}>Stop</button>
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form id="scan-form" className="space-y-4">
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
        <button className="btn btn-primary mt-3 w-full" disabled={pending || !payload} onClick={() => submit(payload, "manual")}>
          <Keyboard className="h-4 w-4" />Record Manually
        </button>
        {message ? <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">{message}</p> : null}
      </section>
    </div>
  );
}
