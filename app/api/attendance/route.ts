import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { recordAttendance, recordAttendanceForParticipant } from "@/lib/data";

function revalidateAttendanceViews() {
  revalidatePath("/dashboard");
  revalidatePath("/participants");
  revalidatePath("/participants/[id]", "page");
  revalidatePath("/attendance");
  revalidatePath("/attendance-percentage");
  revalidatePath("/attendance-meal-reports");
  revalidatePath("/certificates");
  revalidatePath("/teams");
  revalidatePath("/teams/[id]", "page");
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const result = body.participantCode
    ? await recordAttendanceForParticipant(String(body.participantCode), String(body.date ?? ""), String(body.session ?? "MORNING"), "MANUAL_ID", session.directorId)
    : await recordAttendance(String(body.payload ?? ""), String(body.date ?? ""), String(body.session ?? "MORNING"), session.directorId);
  if (result.ok) revalidateAttendanceViews();
  return NextResponse.json(result, { status: result.ok ? 200 : 409 });
}
