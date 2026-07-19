import { ScannerPanel } from "@/components/ScannerPanel";
import { activeSessionFor, sessions, todayInCampTimezone } from "@/lib/camp";

export default function AttendancePage() {
  const today = todayInCampTimezone().toISOString().slice(0, 10);
  const session = activeSessionFor();
  return (
    <ScannerPanel
      title="Attendance QR Scanner"
      endpoint="/api/attendance"
      action="attendance"
      confirmLabel="Record Attendance"
      manualMode="participant-number"
      controls={
        <>
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-600">Camp date</span>
            <input name="date" type="date" className="field" defaultValue={today} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-600">Session</span>
            <select name="session" className="field select-premium" defaultValue={session}>
              {sessions.map((session) => <option key={session}>{session}</option>)}
            </select>
          </label>
        </>
      }
    />
  );
}
