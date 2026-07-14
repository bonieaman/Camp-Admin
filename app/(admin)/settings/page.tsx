import { SettingsManager } from "@/components/SettingsManager";
import { ensureSettings } from "@/lib/camp";
import { prisma } from "@/lib/db";

export default async function SettingsPage() {
  const [settings, teams] = await Promise.all([ensureSettings(), prisma.team.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { participants: true } } } })]);
  return <SettingsManager settings={settings} teams={teams} />;
}
