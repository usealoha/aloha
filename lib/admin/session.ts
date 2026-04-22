import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";
import { db } from "@/db";
import { internalUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

export const ADMIN_COOKIE = "aloha_internal";
const ADMIN_TTL_SECONDS = 60 * 60 * 8; // 8h
const ISSUER = "aloha-admin";

function secret() {
  return new TextEncoder().encode(env.AUTH_SECRET);
}

export type AdminSession = {
  sub: string;
  email: string;
  role: "owner" | "staff";
};

export async function signAdminSession(payload: AdminSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifyAdminSession(
  token: string,
): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: ISSUER });
    if (typeof payload.sub !== "string") return null;
    return {
      sub: payload.sub,
      email: payload.email as string,
      role: payload.role as "owner" | "staff",
    };
  } catch {
    return null;
  }
}

export async function setAdminCookie(token: string) {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: ADMIN_TTL_SECONDS,
  });
}

export async function clearAdminCookie() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

// Returns the live admin row, or null when the cookie is missing / invalid /
// stale (user deleted). Callers should treat null as "not logged in" and
// trigger a 404 via notFound().
export async function getCurrentAdmin() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const session = await verifyAdminSession(token);
  if (!session) return null;
  const [row] = await db
    .select()
    .from(internalUsers)
    .where(eq(internalUsers.id, session.sub))
    .limit(1);
  return row ?? null;
}
