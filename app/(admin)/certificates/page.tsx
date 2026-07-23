import Link from "next/link";
import { AdminDataUnavailable } from "@/components/AdminDataUnavailable";
import { getParticipants } from "@/lib/data";

export default async function CertificatesPage() {
  let participants: Awaited<ReturnType<typeof getParticipants>>;
  try {
    participants = await getParticipants();
  } catch {
    return <AdminDataUnavailable title="Certificate data is temporarily unavailable" />;
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-ink">Certificate Eligibility</h2>
          <p className="text-sm font-semibold text-slate-500">Calculated automatically from attendance, meals, outreach, check-in, and clearance.</p>
        </div>
        <span className="status status-green">{participants.filter((p) => p.certificate.eligible).length} eligible</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>{["Participant", "ID", "Attendance", "Meals", "Outreach", "Status", "Profile"].map((head) => <th key={head} className="border-b border-slate-200 px-3 py-3">{head}</th>)}</tr>
          </thead>
          <tbody>
            {participants.map((p) => (
              <tr key={p.id} className="border-b border-slate-100">
                <td className="px-3 py-4 font-black text-ink">{p.fullName}</td>
                <td className="px-3 py-4 font-black text-royal">{p.participantId}</td>
                <td className="px-3 py-4 font-bold">{p.certificate.attendancePercent}%</td>
                <td className="px-3 py-4 font-bold">{p.certificate.mealsServed}</td>
                <td className="px-3 py-4 font-bold">{p.certificate.outreachDays}</td>
                <td className="px-3 py-4"><span className={`status ${p.certificate.eligible ? "status-green" : "status-amber"}`}>{p.certificate.eligible ? "Eligible" : "Pending"}</span></td>
                <td className="px-3 py-4"><Link href={`/participants/${p.id}`} className="btn btn-secondary py-2">Review</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
