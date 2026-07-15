import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { teamQrPayload } from "@/lib/team-qr";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) return NextResponse.json({ ok: false, message: "Team not found." }, { status: 404 });
  const dataUrl = await QRCode.toDataURL(teamQrPayload(team), {
    width: 1000,
    margin: 2,
    errorCorrectionLevel: "H"
  });
  return NextResponse.json({ ok: true, team: { id: team.id, teamCode: team.teamCode, name: team.name }, dataUrl });
}
