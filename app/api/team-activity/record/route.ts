import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { recordTeamActivity, type TeamActivityType } from "@/lib/data";

function activityType(value: unknown): TeamActivityType {
  return value === "DIGITAL_EVANGELISM" ? "DIGITAL_EVANGELISM" : "OUTREACH";
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const result = await recordTeamActivity(String(body.teamId ?? ""), String(body.date ?? ""), activityType(body.activityType), session.directorId);
  return NextResponse.json(result, { status: result.ok ? 200 : 409 });
}
