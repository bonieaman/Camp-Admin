import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cleanColor } from "@/lib/teams";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function ids(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const name = text(body.name);
  if (!name) return NextResponse.json({ ok: false, message: "Team name is required." }, { status: 400 });
  try {
    const team = await prisma.team.update({
      where: { id },
      data: {
        name,
        description: text(body.description) || null,
        leader: text(body.leader) || null,
        color: cleanColor(text(body.color))
      }
    });
    return NextResponse.json({ ok: true, team });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ ok: false, message: "A team with this name already exists." }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.$transaction(async (tx) => {
    await tx.participant.updateMany({ where: { teamId: id }, data: { teamId: null } });
    await tx.team.delete({ where: { id } });
  });
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const action = text(body.action);
  const participantIds = ids(body.participantIds);
  if (!participantIds.length) return NextResponse.json({ ok: false, message: "Select at least one participant." }, { status: 400 });
  if (action === "remove") {
    await prisma.participant.updateMany({ where: { id: { in: participantIds }, teamId: id }, data: { teamId: null } });
    return NextResponse.json({ ok: true });
  }
  if (action === "move") {
    const targetTeamId = text(body.targetTeamId);
    if (!targetTeamId) return NextResponse.json({ ok: false, message: "Select a target team." }, { status: 400 });
    await prisma.participant.updateMany({ where: { id: { in: participantIds } }, data: { teamId: targetTeamId } });
    return NextResponse.json({ ok: true });
  }
  await prisma.participant.updateMany({ where: { id: { in: participantIds } }, data: { teamId: id } });
  return NextResponse.json({ ok: true });
}
