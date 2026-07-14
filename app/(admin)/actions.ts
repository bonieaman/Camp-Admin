"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { destroySession } from "@/lib/auth";
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
