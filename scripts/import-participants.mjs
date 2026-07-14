import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { importParticipantRows, rowsFromWorkbook } from "../lib/participant-import.ts";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/import-participants.mjs <file.xlsx>");
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const result = await importParticipantRows(rowsFromWorkbook(readFileSync(file)), prisma);
  console.log(JSON.stringify(result, null, 2));
} finally {
  await prisma.$disconnect();
}
