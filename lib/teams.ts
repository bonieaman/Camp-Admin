import "server-only";

import { prisma } from "@/lib/db";

export const TEAM_ID_PREFIX = "YCT-2026";

export function teamCodeFromNumeric(value: string, prefix = TEAM_ID_PREFIX) {
  const trimmed = value.trim();
  if (new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-\\d+$`, "i").test(trimmed)) return trimmed.toUpperCase();
  if (!/^\d+$/.test(trimmed)) return "";
  return `${prefix}-${String(Number(trimmed)).padStart(3, "0")}`;
}

export async function nextTeamCode() {
  const teams = await prisma.team.findMany({ select: { teamCode: true } });
  const nextNumber = teams.reduce((max, team) => {
    const match = team.teamCode.match(new RegExp(`^${TEAM_ID_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(\\d+)$`));
    return Math.max(max, match ? Number(match[1]) : 0);
  }, 0) + 1;
  await prisma.teamCounter.upsert({
    where: { id: "team" },
    create: { id: "team", nextNumber: nextNumber + 1 },
    update: { nextNumber: { increment: 1 } }
  });
  const counter = await prisma.teamCounter.findUnique({ where: { id: "team" } });
  const reserved = counter ? counter.nextNumber - 1 : nextNumber;
  return `${TEAM_ID_PREFIX}-${String(reserved).padStart(3, "0")}`;
}

export function cleanColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : null;
}
