import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import { ensureSettings } from "@/lib/camp";
import { prisma as defaultPrisma } from "@/lib/db";

type Row = Record<string, unknown>;
type ImportClient = PrismaClient | typeof defaultPrisma;

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function clean(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function pick(row: Row, names: string[]) {
  const keys = Object.keys(row);
  const match = keys.find((key) => names.some((name) => key.toLowerCase().includes(name)));
  return match ? clean(row[match]) : "";
}

function identityKey(fullName: string, fatherName: string) {
  return `${normalize(fullName)}|${normalize(fatherName)}`;
}

function tokenFor(participantId: string, fullName: string) {
  return crypto.createHash("sha256").update(`${participantId}:${normalize(fullName)}:yc2026`).digest("hex").slice(0, 32);
}

function parseNumber(participantId: string, prefix: string) {
  const match = participantId.match(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(\\d+)$`));
  return match ? Number(match[1]) : 0;
}

export function rowsFromWorkbook(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" });
}

export async function importParticipantRows(rows: Row[], client: ImportClient = defaultPrisma) {
  const settings = await ensureSettings();

  const prepared = rows
    .map((row, sourceIndex) => {
      const fullName = pick(row, ["full name", "participant name", "name"]);
      const fatherName = pick(row, ["father", "father's", "fathers", "parent"]);
      const spreadsheetId = pick(row, ["participant id", "registration id"]);
      return {
        sourceIndex,
        row,
        fullName,
        fatherName,
        key: identityKey(fullName, fatherName),
        spreadsheetId,
        phone: pick(row, ["phone", "mobile", "contact", "whatsapp"]) || null,
        age: Number(pick(row, ["age"])) || null,
        gender: pick(row, ["gender", "sex"]) || null,
        church: pick(row, ["church", "congregation"]) || null,
        registrationStatus: pick(row, ["payment status"]) || "Registered"
      };
    })
    .filter((row) => row.fullName);

  const uniqueRows = new Map<string, (typeof prepared)[number]>();
  let duplicateRowsSkipped = 0;
  for (const row of prepared) {
    if (uniqueRows.has(row.key)) {
      duplicateRowsSkipped++;
      continue;
    }
    uniqueRows.set(row.key, row);
  }

  const unique = Array.from(uniqueRows.values()).sort((a, b) =>
    a.fullName.localeCompare(b.fullName, undefined, { sensitivity: "base" })
  );
  const existing = await client.participant.findMany({ orderBy: { fullName: "asc" } });
  const byIdentity = new Map(existing.map((participant) => [identityKey(participant.fullName, participant.fatherName ?? ""), participant]));
  const preExistingByParticipantId = new Map(existing.map((participant) => [participant.participantId, participant]));
  let nextNumber = Math.max(0, ...existing.map((participant) => parseNumber(participant.participantId, settings.participantIdPrefix))) + 1;

  let created = 0;
  let updated = 0;
  const invalidRows: number[] = [];

  for (const row of unique) {
    if (!row.fullName) {
      invalidRows.push(row.sourceIndex + 2);
      continue;
    }
    const matched = byIdentity.get(row.key) ?? (row.spreadsheetId ? preExistingByParticipantId.get(row.spreadsheetId) : undefined);
    const participantId = matched?.participantId ?? `${settings.participantIdPrefix}-${String(nextNumber++).padStart(3, "0")}`;
    const data = {
      fullName: row.fullName,
      fatherName: row.fatherName || null,
      age: row.age,
      gender: row.gender,
      phone: row.phone,
      church: row.church,
      registrationStatus: row.registrationStatus,
      teamId: matched?.teamId ?? null
    };

    if (matched) {
      await client.participant.update({ where: { id: matched.id }, data });
      updated++;
      byIdentity.set(row.key, { ...matched, ...data } as typeof matched);
    } else {
      const participant = await client.participant.create({
        data: {
          ...data,
          participantId,
          qrToken: tokenFor(participantId, row.fullName)
        }
      });
      created++;
      byIdentity.set(row.key, participant);
    }
  }

  return {
    ok: true,
    totalRows: rows.length,
    validRows: prepared.length,
    uniqueParticipants: unique.length,
    created,
    updated,
    duplicateRowsSkipped,
    invalidRows
  };
}
