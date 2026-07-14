import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { importParticipantRows, rowsFromWorkbook } from "@/lib/participant-import";

export async function POST(request: Request) {
  if (!(await getSession())) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, message: "No Excel file uploaded." }, { status: 400 });
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await importParticipantRows(rowsFromWorkbook(buffer));
  return NextResponse.json(result);
}
