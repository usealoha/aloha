import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";

// Stateless unsubscribe token. Shape: base64url(subscriberId).base64url(sig)
// where sig = HMAC-SHA256(AUTH_SECRET, subscriberId). No DB lookup needed to
// validate; subscriberId is recovered from the token itself. Using
// AUTH_SECRET keeps the secret-set small; tokens become invalid if the
// secret is ever rotated, which is fine — users can always re-unsubscribe
// via the link in a later email, and the footer always embeds a fresh one.
const ALG = "sha256";

function toB64Url(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf, "utf8") : buf;
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

export function makeUnsubscribeToken(subscriberId: string): string {
  const mac = createHmac(ALG, env.AUTH_SECRET).update(subscriberId).digest();
  return `${toB64Url(subscriberId)}.${toB64Url(mac)}`;
}

export function unsubscribeUrl(subscriberId: string): string {
  return `${env.APP_URL}/u/unsub/${makeUnsubscribeToken(subscriberId)}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encId, encSig] = parts;
  let subscriberId: string;
  let sig: Buffer;
  try {
    subscriberId = fromB64Url(encId).toString("utf8");
    sig = fromB64Url(encSig);
  } catch {
    return null;
  }
  const expected = createHmac(ALG, env.AUTH_SECRET).update(subscriberId).digest();
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(sig, expected)) return null;
  return subscriberId;
}
