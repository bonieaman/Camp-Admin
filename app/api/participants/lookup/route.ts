import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { participantActionStatus, lookupParticipantByCode, lookupParticipantByQr } from "@/lib/data";

export async function POST(request: Request) {
  if (!(await getSession())) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const participant = body.participantCode
    ? await lookupParticipantByCode(String(body.participantCode))
    : await lookupParticipantByQr(String(body.payload ?? ""));
  if (!participant) return NextResponse.json({ ok: false, message: "Participant was not found." }, { status: 404 });

  const action = body.action === "meal" ? "meal" : "attendance";
  const value = action === "meal" ? String(body.meal ?? "BREAKFAST") : String(body.session ?? "MORNING");
  const date = String(body.date ?? "");
  const status = date ? await participantActionStatus(participant.id, date, action, value) : "Not recorded";

  return NextResponse.json({
    ok: true,
    participant: {
      dbId: participant.id,
      id: participant.participantId,
      name: participant.fullName,
      team: participant.team?.name ?? "No Team Assigned",
      church: participant.church ?? "-",
      gender: participant.gender ?? "-",
      photoUrl: null
    },
    status
  });
}
