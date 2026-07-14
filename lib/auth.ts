import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AdminRole, AdminSession } from "@/lib/rbac";

const COOKIE_NAME = "yc_admin_session";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function authSecret() {
  return new TextEncoder().encode(requiredEnv("AUTH_SECRET"));
}

function optionalEnv(name: string) {
  return process.env[name]?.trim();
}

function adminCredentials(): Array<{ directorId: string; passwordHash: string; role: AdminRole }> {
  const admins: Array<{ directorId: string; passwordHash: string; role: AdminRole }> = [
    {
      directorId: optionalEnv("SUPER_ADMIN_ID") ?? requiredEnv("DIRECTOR_ID"),
      passwordHash: optionalEnv("SUPER_ADMIN_PASSWORD_HASH") ?? requiredEnv("DIRECTOR_PASSWORD_HASH"),
      role: "SUPER_ADMIN"
    }
  ];
  const mealId = optionalEnv("MEAL_ADMIN_ID");
  const mealHash = optionalEnv("MEAL_ADMIN_PASSWORD_HASH");
  if (mealId && mealHash) admins.push({ directorId: mealId, passwordHash: mealHash, role: "MEAL_ADMIN" });
  const attendanceId = optionalEnv("ATTENDANCE_ADMIN_ID");
  const attendanceHash = optionalEnv("ATTENDANCE_ADMIN_PASSWORD_HASH");
  if (attendanceId && attendanceHash) admins.push({ directorId: attendanceId, passwordHash: attendanceHash, role: "ATTENDANCE_ADMIN" });
  return admins;
}

export async function validateDirector(directorId: string, password: string): Promise<AdminSession | null> {
  const admin = adminCredentials().find((credential) => credential.directorId === directorId);
  if (!admin) return null;
  const valid = await bcrypt.compare(password, admin.passwordHash);
  return valid ? { directorId: admin.directorId, role: admin.role } : null;
}

export async function createSession(session: AdminSession) {
  const token = await new SignJWT({ directorId: session.directorId, role: session.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(authSecret());

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function getSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const result = await jwtVerify(token, authSecret());
    const directorId = typeof result.payload.directorId === "string" ? result.payload.directorId : "";
    const role = result.payload.role as AdminRole | undefined;
    const admin = adminCredentials().find((credential) => credential.directorId === directorId && credential.role === role);
    return admin ? { directorId, role: admin.role } : null;
  } catch {
    return null;
  }
}
