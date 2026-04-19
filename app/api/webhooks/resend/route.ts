import { createHmac, timingSafeEqual } from "crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import {
  broadcastSends,
  broadcasts,
  subscribers,
} from "@/db/schema";
import { env } from "@/lib/env";

// Resend webhook events we care about. The full event list includes
// email.sent and email.delivery_delayed too; we ignore those because
// they're either already tracked (we set `sent` locally) or don't map
// cleanly onto a terminal state.
type ResendEventType =
  | "email.delivered"
  | "email.bounced"
  | "email.opened"
  | "email.clicked"
  | "email.complained";

type ResendEvent = {
  type: ResendEventType | string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[];
  };
};

// Svix signature verification. Resend signs webhooks via Svix; spec:
//   signed = `${svix-id}.${svix-timestamp}.${body}`
//   sig    = base64(HMAC-SHA256(decoded-secret, signed))
// svix-signature header carries one or more space-separated `v1,<sig>`
// entries — match any. Secret is stored as `whsec_<base64>`; strip prefix
// and decode before HMAC.
function verifySvix(
  body: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  secret: string,
): boolean {
  if (!headers.id || !headers.timestamp || !headers.signature) return false;

  const rawSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  let key: Buffer;
  try {
    key = Buffer.from(rawSecret, "base64");
  } catch {
    return false;
  }

  const signed = `${headers.id}.${headers.timestamp}.${body}`;
  const expected = createHmac("sha256", key).update(signed).digest();

  const provided: Buffer[] = [];
  for (const entry of headers.signature.split(" ")) {
    const parts = entry.split(",");
    if (parts[0] !== "v1" || !parts[1]) continue;
    try {
      provided.push(Buffer.from(parts[1], "base64"));
    } catch {}
  }

  return provided.some(
    (sig) => sig.length === expected.length && timingSafeEqual(sig, expected),
  );
}

export async function POST(req: NextRequest) {
  if (!env.RESEND_WEBHOOK_SECRET) {
    // Fail loud in production: a webhook without a secret is a hole.
    return new NextResponse("Webhook secret not configured", { status: 503 });
  }

  const body = await req.text();
  const ok = verifySvix(
    body,
    {
      id: req.headers.get("svix-id"),
      timestamp: req.headers.get("svix-timestamp"),
      signature: req.headers.get("svix-signature"),
    },
    env.RESEND_WEBHOOK_SECRET,
  );
  if (!ok) return new NextResponse("Invalid signature", { status: 401 });

  let event: ResendEvent;
  try {
    event = JSON.parse(body) as ResendEvent;
  } catch {
    return new NextResponse("Malformed body", { status: 400 });
  }

  const emailId = event.data?.email_id;
  if (!emailId) {
    // Not every Resend event carries email_id (e.g. domain events). Accept
    // and ignore so Resend doesn't retry forever.
    return NextResponse.json({ ignored: "no email_id" });
  }

  const send = await db.query.broadcastSends.findFirst({
    where: eq(broadcastSends.resendMessageId, emailId),
  });
  if (!send) {
    // Email might be a transactional send (verification, welcome) that
    // doesn't live in broadcast_sends. Silent ack so Resend stops retrying.
    return NextResponse.json({ ignored: "not a broadcast send" });
  }

  const now = new Date();

  switch (event.type) {
    case "email.delivered":
      await db
        .update(broadcastSends)
        .set({ status: "delivered", deliveredAt: now, updatedAt: now })
        .where(eq(broadcastSends.id, send.id));
      await db
        .update(broadcasts)
        .set({
          deliveredCount: sql`${broadcasts.deliveredCount} + 1`,
          updatedAt: now,
        })
        .where(eq(broadcasts.id, send.broadcastId));
      break;

    case "email.bounced":
      await db
        .update(broadcastSends)
        .set({
          status: "bounced",
          errorMessage: "bounced",
          updatedAt: now,
        })
        .where(eq(broadcastSends.id, send.id));
      await db
        .update(broadcasts)
        .set({
          bouncedCount: sql`${broadcasts.bouncedCount} + 1`,
          updatedAt: now,
        })
        .where(eq(broadcasts.id, send.broadcastId));
      break;

    case "email.opened":
      // Only count the first open per recipient. Subsequent opens still
      // refresh `updatedAt` for debugging but don't bump the aggregate.
      if (!send.openedAt) {
        await db
          .update(broadcastSends)
          .set({ openedAt: now, updatedAt: now })
          .where(and(eq(broadcastSends.id, send.id), isNull(broadcastSends.openedAt)));
        await db
          .update(broadcasts)
          .set({
            openedCount: sql`${broadcasts.openedCount} + 1`,
            updatedAt: now,
          })
          .where(eq(broadcasts.id, send.broadcastId));
      }
      break;

    case "email.clicked":
      if (!send.clickedAt) {
        await db
          .update(broadcastSends)
          .set({ clickedAt: now, updatedAt: now })
          .where(and(eq(broadcastSends.id, send.id), isNull(broadcastSends.clickedAt)));
        await db
          .update(broadcasts)
          .set({
            clickedCount: sql`${broadcasts.clickedCount} + 1`,
            updatedAt: now,
          })
          .where(eq(broadcasts.id, send.broadcastId));
      }
      break;

    case "email.complained":
      // Spam complaint — auto-unsubscribe. Complaints are a deliverability
      // signal we must act on; continuing to send to someone who flagged
      // us as spam wrecks our domain reputation.
      await db
        .update(broadcastSends)
        .set({ status: "complained", updatedAt: now })
        .where(eq(broadcastSends.id, send.id));
      await db
        .update(subscribers)
        .set({ unsubscribedAt: now, updatedAt: now })
        .where(
          and(
            eq(subscribers.id, send.subscriberId),
            isNull(subscribers.unsubscribedAt),
          ),
        );
      await db
        .update(broadcasts)
        .set({
          unsubscribedCount: sql`${broadcasts.unsubscribedCount} + 1`,
          updatedAt: now,
        })
        .where(eq(broadcasts.id, send.broadcastId));
      break;

    default:
      // email.sent / email.delivery_delayed / unknown — no-op.
      break;
  }

  return NextResponse.json({ ok: true });
}
