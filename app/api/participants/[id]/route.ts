import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

function text(value: unknown) {
  return String(value ?? "").trim();
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const fullName = text(body.fullName);
  if (!fullName) return NextResponse.json({ ok: false, message: "Name is required." }, { status: 400 });
  const participant = await prisma.participant.update({
    where: { id },
    data: {
      fullName,
      fatherName: text(body.fatherName) || null,
      age: Number(body.age) || null,
      gender: text(body.gender) || null,
      phone: text(body.phone) || null,
      church: text(body.church) || null,
      registrationStatus: text(body.registrationStatus) || "Registered",
      teamId: text(body.teamId) || null
    }
  });
  return NextResponse.json({ ok: true, participant });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.participant.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
