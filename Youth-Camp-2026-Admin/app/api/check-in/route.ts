import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { checkInParticipant } from "@/lib/data";

export async function POST(request: Request) {
  if (!(await getSession())) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const result = await checkInParticipant(String(body.participantCode ?? ""));
  return NextResponse.json(result, { status: result.ok ? 200 : 409 });
}
