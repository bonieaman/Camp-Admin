"use server";

import { redirect } from "next/navigation";
import { createSession, validateDirector } from "@/lib/auth";

export async function loginAction(_: { error: string }, formData: FormData) {
  const directorId = String(formData.get("directorId") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const session = await validateDirector(directorId, password);
  if (!session) {
    return { error: "Invalid Director ID or password." };
  }
  await createSession(session);
  redirect("/dashboard");
}
