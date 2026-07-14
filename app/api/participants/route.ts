import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureSettings } from "@/lib/camp";
import { prisma } from "@/lib/db";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function nextParticipantNumber(ids: string[], prefix: string) {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const numbers = ids
    .map((id) => id.match(new RegExp(`^${escaped}-(\\d+)$`))?.[1])
    .filter(Boolean)
    .map(Number);
  return Math.max(0, ...numbers) + 1;
}

function qrToken(participantId: string, fullName: string) {
  return crypto.createHash("sha256").update(`${participantId}:${fullName.toLocaleLowerCase()}:yc2026`).digest("hex").slice(0, 32);
}

export async function POST(request: Request) {
  if (!(await getSession())) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const fullName = text(body.fullName);
  if (!fullName) return NextResponse.json({ ok: false, message: "Name is required." }, { status: 400 });
  const settings = await ensureSettings();
  const existing = await prisma.participant.findMany({ select: { participantId: true } });
  const participantId = `${settings.participantIdPrefix}-${String(nextParticipantNumber(existing.map((p) => p.participantId), settings.participantIdPrefix)).padStart(3, "0")}`;
  const participant = await prisma.participant.create({
    data: {
      participantId,
      fullName,
      fatherName: text(body.fatherName) || null,
      age: Number(body.age) || null,
      gender: text(body.gender) || null,
      phone: text(body.phone) || null,
      church: text(body.church) || null,
      registrationStatus: text(body.registrationStatus) || "Registered",
      teamId: text(body.teamId) || null,
      qrToken: qrToken(participantId, fullName)
    }
  });
  return NextResponse.json({ ok: true, participant });
}
