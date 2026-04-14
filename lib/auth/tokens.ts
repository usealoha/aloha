import "server-only";
import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { verificationTokens } from "@/db/schema";

const TOKEN_BYTES = 32;
const TTL_MS = 24 * 60 * 60 * 1000;

function hash(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function createVerificationToken(
  email: string,
): Promise<{ token: string; expires: Date }> {
  const raw = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const expires = new Date(Date.now() + TTL_MS);

  await db.insert(verificationTokens).values({
    identifier: email,
    token: hash(raw),
    expires,
  });

  return { token: raw, expires };
}

export async function consumeVerificationToken(
  raw: string,
): Promise<{ email: string } | null> {
  const hashed = hash(raw);

  const [row] = await db
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.token, hashed))
    .limit(1);

  if (!row) return null;

  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, row.identifier),
        eq(verificationTokens.token, hashed),
      ),
    );

  if (row.expires.getTime() < Date.now()) return null;

  return { email: row.identifier };
}
