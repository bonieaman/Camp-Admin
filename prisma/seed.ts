import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.setting.upsert({
    where: { id: "camp" },
    update: {},
    create: {
      id: "camp",
      campName: "Youth Camp 2026",
      startDate: new Date("2026-07-08T00:00:00.000Z"),
      endDate: new Date("2026-07-18T00:00:00.000Z"),
      totalDays: 11,
      timezone: "Africa/Addis_Ababa",
      participantIdPrefix: "YC-2026",
      finalRequiredDate: new Date("2026-07-18T00:00:00.000Z"),
      finalRequiredSession: "AFTERNOON"
    }
  });
  await prisma.team.upsert({ where: { name: "Unassigned" }, create: { name: "Unassigned" }, update: {} });
}

main().finally(() => prisma.$disconnect());
