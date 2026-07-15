import "server-only";

import { prisma } from "@/lib/db";

const TEAM_QR_PREFIX = "YC2026TEAM";

export function teamQrPayload(team: { id: string; teamCode?: string; qrToken: string }) {
  const teamId = "teamCode" in team && typeof team.teamCode === "string" ? team.teamCode : team.id;
  return `${TEAM_QR_PREFIX}:${teamId}:${team.qrToken}`;
}

export function parseTeamQrPayload(payload: string) {
  const [prefix, teamIdentifier, qrToken] = payload.split(":");
  if (prefix !== TEAM_QR_PREFIX || !teamIdentifier || !qrToken) return null;
  return { teamIdentifier, qrToken };
}

export async function lookupTeamByQr(payload: string) {
  const parsed = parseTeamQrPayload(payload);
  if (!parsed) return null;
  const team = await prisma.team.findFirst({
    where: { OR: [{ id: parsed.teamIdentifier }, { teamCode: parsed.teamIdentifier }] },
    include: { _count: { select: { participants: true } } }
  });
  if (!team || team.qrToken !== parsed.qrToken) return null;
  return team;
}
