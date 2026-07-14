import { ScannerPanel } from "@/components/ScannerPanel";
import { sessions, todayInCampTimezone } from "@/lib/camp";

export default function AttendancePage() {
  const today = todayInCampTimezone().toISOString().slice(0, 10);
  return (
    <ScannerPanel
      title="Attendance QR Scanner"
      endpoint="/api/attendance"
      manualMode="participant-number"
      controls={
        <>
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-600">Camp date</span>
            <input name="date" type="date" className="field" defaultValue={today} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-600">Session</span>
            <select name="session" className="field select-premium" defaultValue="MORNING">
              {sessions.map((session) => <option key={session}>{session}</option>)}
            </select>
          </label>
        </>
      }
    />
  );
}
