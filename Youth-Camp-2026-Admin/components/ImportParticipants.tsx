"use client";

import { FileSpreadsheet, Upload } from "lucide-react";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";

export function ImportParticipants() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Record<string, unknown>[]>([]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function handleFile(file: File) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    setPreview(XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" }).slice(0, 5));
    setMessage("");
  }

  async function upload() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setPending(true);
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/import", { method: "POST", body: form });
    const result = await response.json();
    setPending(false);
    setMessage(
      result.ok
        ? `Imported ${result.created} new, updated ${result.updated}, skipped ${result.duplicateRowsSkipped} duplicate workbook rows, and found ${result.uniqueParticipants} unique participants.`
        : result.message
    );
    window.dispatchEvent(new Event("yc:data-change"));
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-ink">Excel Participant Import</h2>
          <p className="text-sm font-semibold text-slate-500">Supports .xlsx and .xls files with preview before import.</p>
        </div>
        <FileSpreadsheet className="h-6 w-6 text-royal" />
      </div>
      <div className="flex flex-wrap gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="field max-w-sm"
          onChange={(event) => event.target.files?.[0] && handleFile(event.target.files[0])}
        />
        <button className="btn btn-primary" onClick={upload} disabled={pending}>
          <Upload className="h-4 w-4" />
          {pending ? "Importing..." : "Import Participants"}
        </button>
      </div>
      {preview.length ? (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{Object.keys(preview[0]).slice(0, 7).map((key) => <th key={key} className="px-3 py-2">{key}</th>)}</tr>
            </thead>
            <tbody>
              {preview.map((row, index) => (
                <tr key={index} className="border-t border-slate-100">
                  {Object.keys(preview[0]).slice(0, 7).map((key) => <td key={key} className="px-3 py-2 font-semibold text-slate-700">{String(row[key] ?? "")}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {message ? <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">{message}</p> : null}
    </div>
  );
}
