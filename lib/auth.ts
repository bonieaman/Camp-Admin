import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const DIRECTOR_ID = "YC-2026-000";
const PASSWORD_HASH = "$2a$10$tNqBXlNxKJFX/g5SD48bS.DocG3DEUt2HnmhGuFV3pg7uY89TmCF2";
const COOKIE_NAME = "yc_admin_session";

function secret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-youth-camp-2026-secret-change-me");
}

export async function validateDirector(directorId: string, password: string) {
  return directorId === DIRECTOR_ID && (await bcrypt.compare(password, PASSWORD_HASH));
}

export async function createSession() {
  const token = await new SignJWT({ directorId: DIRECTOR_ID })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret());

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
    const result = await jwtVerify(token, secret());
    return result.payload.directorId === DIRECTOR_ID ? { directorId: DIRECTOR_ID } : null;
  } catch {
    return null;
  }
}
