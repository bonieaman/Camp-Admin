import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { qrDataUrl } from "@/lib/qr";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await params;
  const participant = await prisma.participant.findUnique({ where: { id } });
  if (!participant) return NextResponse.json({ ok: false }, { status: 404 });
  const dataUrl = await qrDataUrl(participant.participantId, participant.qrToken, 1024);
  return NextResponse.json({ dataUrl });
}
