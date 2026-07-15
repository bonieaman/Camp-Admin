import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cleanColor, nextTeamCode } from "@/lib/teams";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function ids(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

export async function POST(request: Request) {
  if (!(await getSession())) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const name = text(body.name);
  if (!name) return NextResponse.json({ ok: false, message: "Team name is required." }, { status: 400 });
  const participantIds = ids(body.participantIds);
  const teamCode = await nextTeamCode();
  try {
    const team = await prisma.$transaction(async (tx) => {
      const created = await tx.team.create({
        data: {
          name,
          teamCode,
          description: text(body.description) || null,
          leader: text(body.leader) || null,
          color: cleanColor(text(body.color))
        }
      });
      if (participantIds.length) {
        await tx.participant.updateMany({ where: { id: { in: participantIds } }, data: { teamId: created.id } });
      }
      return created;
    });
    return NextResponse.json({ ok: true, team });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ ok: false, message: "A team with this name already exists." }, { status: 409 });
    }
    throw error;
  }
}
