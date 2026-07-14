"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { destroySession, getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function toggleCheckIn(participantDbId: string, checkedIn: boolean) {
  await prisma.participant.update({
    where: { id: participantDbId },
    data: { checkedIn, checkedInAt: checkedIn ? new Date() : null }
  });
  revalidatePath("/dashboard");
  revalidatePath("/participants");
  revalidatePath(`/participants/${participantDbId}`);
}

export async function updateParticipantTeam(participantDbId: string, teamId: string) {
  await prisma.participant.update({
    where: { id: participantDbId },
    data: { teamId: teamId || null }
  });
  revalidatePath("/dashboard");
  revalidatePath("/participants");
  revalidatePath(`/participants/${participantDbId}`);
}

export async function createTeam(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (name) await prisma.team.upsert({ where: { name }, create: { name }, update: {} });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function updateSettings(formData: FormData) {
  await prisma.setting.upsert({
    where: { id: "camp" },
    create: {
      id: "camp",
      campName: String(formData.get("campName") ?? "Youth Camp 2026"),
      startDate: new Date(`${String(formData.get("startDate"))}T00:00:00.000Z`),
      endDate: new Date(`${String(formData.get("endDate"))}T00:00:00.000Z`),
      totalDays: Number(formData.get("totalDays")) || 11,
      timezone: String(formData.get("timezone") ?? "Africa/Addis_Ababa"),
      participantIdPrefix: String(formData.get("participantIdPrefix") ?? "YC-2026"),
      finalRequiredDate: new Date(`${String(formData.get("finalRequiredDate"))}T00:00:00.000Z`),
      finalRequiredSession: String(formData.get("finalRequiredSession") ?? "AFTERNOON")
    },
    update: {
      campName: String(formData.get("campName") ?? "Youth Camp 2026"),
      startDate: new Date(`${String(formData.get("startDate"))}T00:00:00.000Z`),
      endDate: new Date(`${String(formData.get("endDate"))}T00:00:00.000Z`),
      totalDays: Number(formData.get("totalDays")) || 11,
      timezone: String(formData.get("timezone") ?? "Africa/Addis_Ababa"),
      participantIdPrefix: String(formData.get("participantIdPrefix") ?? "YC-2026"),
      finalRequiredDate: new Date(`${String(formData.get("finalRequiredDate"))}T00:00:00.000Z`),
      finalRequiredSession: String(formData.get("finalRequiredSession") ?? "AFTERNOON")
    }
  });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function updateTeam(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (id && name) await prisma.team.update({ where: { id }, data: { name } });
  revalidatePath("/settings");
  revalidatePath("/participants");
  revalidatePath("/dashboard");
}

export async function deleteTeam(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.participant.updateMany({ where: { teamId: id }, data: { teamId: null } });
    await prisma.team.delete({ where: { id } });
  }
  revalidatePath("/settings");
  revalidatePath("/participants");
  revalidatePath("/dashboard");
}

export async function createChallengeRecord(formData: FormData) {
  const session = await getSession();
  const participantId = String(formData.get("participantId") ?? "");
  const challenge = String(formData.get("challenge") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  if (!participantId || !challenge || !date) return;
  const campDate = new Date(`${date}T00:00:00.000Z`);
  const { campDayFor } = await import("@/lib/camp");
  await prisma.challengeRecord.upsert({
    where: { participantId_campDate_challenge: { participantId, campDate, challenge } },
    create: { participantId, campDate, campDay: campDayFor(campDate), challenge, recordedBy: session?.directorId },
    update: {}
  });
  revalidatePath("/dashboard");
  revalidatePath("/certificates");
  revalidatePath(`/participants/${participantId}`);
}

export async function deleteChallengeRecord(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.challengeRecord.delete({ where: { id } });
  revalidatePath("/dashboard");
  revalidatePath("/certificates");
  const participantId = String(formData.get("participantId") ?? "");
  if (participantId) revalidatePath(`/participants/${participantId}`);
}
