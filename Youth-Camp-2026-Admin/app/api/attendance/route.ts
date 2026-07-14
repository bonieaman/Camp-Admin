import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { recordAttendance, recordAttendanceForParticipant } from "@/lib/data";

export async function POST(request: Request) {
  if (!(await getSession())) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const result = body.participantCode
    ? await recordAttendanceForParticipant(String(body.participantCode), String(body.date ?? ""), String(body.session ?? "MORNING"), "MANUAL_ID")
    : await recordAttendance(String(body.payload ?? ""), String(body.date ?? ""), String(body.session ?? "MORNING"));
  return NextResponse.json(result, { status: result.ok ? 200 : 409 });
}
