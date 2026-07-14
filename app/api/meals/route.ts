import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { recordMeal, recordMealForParticipant } from "@/lib/data";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const result = body.participantCode
    ? await recordMealForParticipant(String(body.participantCode), String(body.date ?? ""), String(body.meal ?? "BREAKFAST"), "MANUAL_ID", session.directorId)
    : await recordMeal(String(body.payload ?? ""), String(body.date ?? ""), String(body.meal ?? "BREAKFAST"), session.directorId);
  return NextResponse.json(result, { status: result.ok ? 200 : 409 });
}
