import "server-only";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { env } from "@/lib/env";

// Broadcast entitlement is currently allowlist-based: the email add-on
// SKU on Polar hasn't shipped yet, so we gate on BROADCASTS_ALLOWLIST
// (comma-separated emails). When the SKU lands, replace this helper with
// a Polar check — the call sites don't need to change.
//
// Memory: email is billed separately from Basic/Muse because Resend/SES
// costs scale per-tenant and per-message.
export async function hasBroadcastEntitlement(userId: string): Promise<boolean> {
  const allowlist = (env.BROADCASTS_ALLOWLIST ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowlist.length === 0) return false;

  const [row] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row?.email) return false;

  return allowlist.includes(row.email.toLowerCase());
}

export async function requireBroadcastEntitlement(userId: string): Promise<void> {
  const ok = await hasBroadcastEntitlement(userId);
  if (!ok) {
    throw new Error(
      "Broadcasts are part of our email add-on. Ask us for early access.",
    );
  }
}
