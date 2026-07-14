import "server-only";

import { prisma } from "@/lib/db";

const TEAM_QR_PREFIX = "YC2026TEAM";

export function teamQrPayload(team: { id: string; qrToken: string }) {
  return `${TEAM_QR_PREFIX}:${team.id}:${team.qrToken}`;
}

export function parseTeamQrPayload(payload: string) {
  const [prefix, teamId, qrToken] = payload.split(":");
  if (prefix !== TEAM_QR_PREFIX || !teamId || !qrToken) return null;
  return { teamId, qrToken };
}

export async function lookupTeamByQr(payload: string) {
  const parsed = parseTeamQrPayload(payload);
  if (!parsed) return null;
  const team = await prisma.team.findUnique({ where: { id: parsed.teamId }, include: { _count: { select: { participants: true } } } });
  if (!team || team.qrToken !== parsed.qrToken) return null;
  return team;
}
