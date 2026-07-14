import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "yc_admin_session";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function directorId() {
  return requiredEnv("DIRECTOR_ID");
}

function passwordHash() {
  return requiredEnv("DIRECTOR_PASSWORD_HASH");
}

function authSecret() {
  return new TextEncoder().encode(requiredEnv("AUTH_SECRET"));
}

export async function validateDirector(directorId: string, password: string) {
  return directorId === directorIdFromEnv() && (await bcrypt.compare(password, passwordHash()));
}

function directorIdFromEnv() {
  return directorId();
}

export async function createSession() {
  const id = directorIdFromEnv();
  const token = await new SignJWT({ directorId: id })
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

export async function getSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const id = directorIdFromEnv();
    const result = await jwtVerify(token, authSecret());
    return result.payload.directorId === id ? { directorId: id } : null;
  } catch {
    return null;
  }
}
