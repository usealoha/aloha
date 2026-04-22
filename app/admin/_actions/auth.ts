"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { internalUsers } from "@/db/schema";
import {
  clearAdminCookie,
  setAdminCookie,
  signAdminSession,
} from "@/lib/admin/session";
import {
  buildTotpUri,
  generateTotpSecret,
  isDevBypassEnabled,
  renderThemedQrSvg,
  verifyTotp,
} from "@/lib/admin/totp";
import { logAdminAction } from "@/lib/admin/audit";

export type LoginStep =
  | { step: "credentials"; error?: string }
  | {
      step: "enroll";
      error?: string;
      pendingToken: string;
      secret: string;
      qrSvg: string;
    }
  | { step: "totp"; error?: string; pendingToken: string };

// Short-lived "I know the password" token used between steps. Lives in a
// hidden form field, not a cookie — it's useless without the password.
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

const pendingSecret = () => new TextEncoder().encode(env.AUTH_SECRET);

async function signPending(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("aloha-admin-pending")
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(pendingSecret());
}

async function verifyPending(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, pendingSecret(), {
      issuer: "aloha-admin-pending",
    });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function submitCredentials(
  _prev: LoginStep,
  formData: FormData,
): Promise<LoginStep> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { step: "credentials", error: "Email and password are required." };
  }

  const [user] = await db
    .select()
    .from(internalUsers)
    .where(eq(internalUsers.email, email))
    .limit(1);

  // Constant-ish failure: always compare against *some* hash so timing
  // doesn't leak which emails exist.
  const hash = user?.passwordHash ?? "$2b$10$invalidinvalidinvalidinvalidinva";
  const ok = await bcrypt.compare(password, hash);
  if (!user || !ok) {
    return { step: "credentials", error: "Invalid credentials." };
  }

  const pendingToken = await signPending(user.id);

  // Dev shortcut: skip enrollment entirely and auto-stamp a placeholder
  // secret. Production still requires a real authenticator setup.
  if (!user.totpSecret && isDevBypassEnabled()) {
    await db
      .update(internalUsers)
      .set({
        totpSecret: generateTotpSecret(),
        totpEnrolledAt: new Date(),
      })
      .where(eq(internalUsers.id, user.id));
    return { step: "totp", pendingToken };
  }

  // First login: enroll TOTP. Generate a secret, show QR, and require a
  // verifying code before it's persisted.
  if (!user.totpSecret) {
    const secret = generateTotpSecret();
    const uri = buildTotpUri(user.email, secret);
    const qrSvg = await renderThemedQrSvg(uri);
    // Secret is held in a second pending token so the server can trust it
    // on the enroll submit without a DB write mid-enrollment.
    const secretToken = await new SignJWT({ secret })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("aloha-admin-enroll")
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime("10m")
      .sign(pendingSecret());
    return {
      step: "enroll",
      pendingToken: secretToken,
      secret,
      qrSvg,
    };
  }

  return { step: "totp", pendingToken };
}

export async function submitTotp(
  _prev: LoginStep,
  formData: FormData,
): Promise<LoginStep> {
  const pendingToken = String(formData.get("pendingToken") ?? "");
  const code = String(formData.get("code") ?? "");
  const userId = await verifyPending(pendingToken);
  if (!userId) {
    return { step: "credentials", error: "Session expired. Sign in again." };
  }
  const [user] = await db
    .select()
    .from(internalUsers)
    .where(eq(internalUsers.id, userId))
    .limit(1);
  if (!user || !user.totpSecret) {
    return { step: "credentials", error: "Session expired. Sign in again." };
  }
  if (!verifyTotp(user.totpSecret, code)) {
    return { step: "totp", pendingToken, error: "Invalid code. Try again." };
  }

  await db
    .update(internalUsers)
    .set({ lastLoginAt: new Date() })
    .where(eq(internalUsers.id, user.id));

  const token = await signAdminSession({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  await setAdminCookie(token);
  await logAdminAction({ actorId: user.id, action: "admin.login" });
  redirect("/admin");
}

export async function submitEnrollment(
  _prev: LoginStep,
  formData: FormData,
): Promise<LoginStep> {
  const pendingToken = String(formData.get("pendingToken") ?? "");
  const code = String(formData.get("code") ?? "");

  let userId: string;
  let secret: string;
  try {
    const { payload } = await jwtVerify(pendingToken, pendingSecret(), {
      issuer: "aloha-admin-enroll",
    });
    if (typeof payload.sub !== "string" || typeof payload.secret !== "string") {
      throw new Error("bad");
    }
    userId = payload.sub;
    secret = payload.secret;
  } catch {
    return { step: "credentials", error: "Enrollment expired. Sign in again." };
  }

  if (!verifyTotp(secret, code)) {
    // Re-render the enroll step with the same secret/qr intact.
    const uri = buildTotpUri("", secret);
    const qrSvg = await renderThemedQrSvg(uri);
    return {
      step: "enroll",
      pendingToken,
      secret,
      qrSvg,
      error: "Invalid code. Try again.",
    };
  }

  const [user] = await db
    .update(internalUsers)
    .set({
      totpSecret: secret,
      totpEnrolledAt: new Date(),
      lastLoginAt: new Date(),
    })
    .where(eq(internalUsers.id, userId))
    .returning();

  if (!user) {
    return { step: "credentials", error: "Something went wrong." };
  }

  const token = await signAdminSession({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  await setAdminCookie(token);
  await logAdminAction({
    actorId: user.id,
    action: "admin.totp_enrolled",
  });
  redirect("/admin");
}

export async function signOutAdmin() {
  await clearAdminCookie();
  redirect("/admin/login");
}
