// Inbound email → idea capture. A forwarder (Cloudflare Email Routing
// Worker, Postmark Inbound, etc.) POSTs the parsed message here; we file
// it as a row in `ideas` scoped to the workspace whose alias was hit.
//
// Expected envelope:
//   POST /api/webhooks/email/inbound
//   Authorization: Bearer <INBOUND_EMAIL_SECRET>
//   Content-Type: application/json
//   Body: {
//     to: string,            // recipient(s), comma-separated, must include alias
//     from: string,          // sender mailbox (RFC5322; "Name <addr>" tolerated)
//     subject?: string,
//     text?: string,         // plain-text body (preferred)
//     html?: string,         // fallback when no text part
//     messageId?: string,    // platform-issued id, dedupes resends
//   }
//
// Sender is matched against `users.email` to attribute the idea. When no
// match, it lands under the workspace owner with a metadata note.

import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ideas, users, workspaceMembers, workspaces } from "@/db/schema";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Permissive envelope: different inbound vendors send different shapes
// (Resend, Postmark, SES-via-Lambda, custom forwarders). We accept any
// of camelCase, PascalCase, and a couple of nested address shapes,
// then normalize to a single internal record before doing real work.
type RawBody = Record<string, unknown>;

type NormalizedEmail = {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
  messageId: string | null;
};

function pickString(body: RawBody, ...keys: string[]): string {
  for (const k of keys) {
    const v = body[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return "";
}

// Some vendors send `from: { email, name }` and `to: [{ email }, ...]`.
// We coerce these into the RFC-5322-ish header strings the rest of the
// pipeline expects.
function pickAddressField(body: RawBody, ...keys: string[]): string {
  for (const k of keys) {
    const v = body[k];
    if (typeof v === "string" && v.length > 0) return v;
    if (Array.isArray(v)) {
      const parts = v
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            const obj = item as Record<string, unknown>;
            if (typeof obj.email === "string") return obj.email;
            if (typeof obj.address === "string") return obj.address;
          }
          return null;
        })
        .filter((s): s is string => Boolean(s));
      if (parts.length > 0) return parts.join(", ");
    }
    if (v && typeof v === "object") {
      const obj = v as Record<string, unknown>;
      if (typeof obj.email === "string") return obj.email;
      if (typeof obj.address === "string") return obj.address;
    }
  }
  return "";
}

function normalizeBody(body: RawBody): NormalizedEmail {
  // Some vendors wrap the message in `data` or `email`. Unwrap before
  // looking up keys so the call sites stay flat.
  const inner =
    (body.data && typeof body.data === "object" ? body.data : null) ??
    (body.email && typeof body.email === "object" ? body.email : null);
  const src = (inner ?? body) as RawBody;

  return {
    to: pickAddressField(src, "to", "To", "recipients"),
    from: pickAddressField(src, "from", "From", "sender"),
    subject: pickString(src, "subject", "Subject"),
    text: pickString(src, "text", "TextBody", "plain", "text_body"),
    html: pickString(src, "html", "HtmlBody", "html_body"),
    messageId:
      pickString(src, "messageId", "MessageID", "message_id", "id") || null,
  };
}

const ALIAS_RX = /^ideas-([a-z0-9]{6,16})$/i;

// "Name <addr@x>" → "addr@x"; bare "addr@x" → "addr@x"; otherwise null.
function pickAddress(raw: string): string | null {
  const m = raw.match(/<([^>]+)>/);
  const candidate = (m ? m[1] : raw).trim().toLowerCase();
  return candidate.includes("@") ? candidate : null;
}

// First address that matches our inbound domain. The forwarder usually
// sends a single recipient but some setups deliver Cc/Bcc — pick the
// first that's actually addressed at us.
function findAlias(toHeader: string, domain: string): string | null {
  const parts = toHeader.split(/[,;]/);
  for (const part of parts) {
    const addr = pickAddress(part);
    if (!addr) continue;
    const [local, host] = addr.split("@");
    if (host !== domain.toLowerCase()) continue;
    const m = local.match(ALIAS_RX);
    if (m) return m[1].toLowerCase();
  }
  return null;
}

// Plain-ish text from html — last-resort fallback when the forwarder
// didn't send a text part. We don't try to be perfect here; the user
// can always click into the idea and edit. Strips tags, decodes a few
// common entities, collapses whitespace.
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?(p|div|br|h[1-6]|li|tr)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const MAX_TITLE = 240;
const MAX_BODY = 50_000;

export async function POST(req: NextRequest) {
  const expected = env.INBOUND_EMAIL_SECRET;
  const domain = env.INBOUND_EMAIL_DOMAIN;
  if (!expected || !domain) {
    return new Response("Inbound email is not configured.", { status: 503 });
  }

  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ") || auth.slice("Bearer ".length) !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }

  const raw = (await req.json().catch(() => ({}))) as RawBody;
  const normalized = normalizeBody(raw);
  const { to: toRaw, from: fromRaw, subject: subjectRaw, text: textRaw, html: htmlRaw, messageId } = normalized;

  if (!toRaw || !fromRaw) {
    // Surface what arrived so we can adjust the parser. Vendor schemas
    // shift; logging top-level keys is enough to figure out the right
    // synonym without leaking message bodies.
    console.warn(
      "[inbound-email] missing to/from after normalization",
      { topKeys: Object.keys(raw) },
    );
    return NextResponse.json(
      { error: "to and from are required" },
      { status: 400 },
    );
  }

  const shortId = findAlias(toRaw, domain);
  if (!shortId) {
    // Drop quietly with 200 so the forwarder doesn't retry forever — the
    // alias was malformed or addressed at a non-Aloha domain.
    return NextResponse.json({ ok: false, reason: "alias_not_found" });
  }

  const [workspace] = await db
    .select({ id: workspaces.id, ownerUserId: workspaces.ownerUserId })
    .from(workspaces)
    .where(eq(workspaces.shortId, shortId))
    .limit(1);
  if (!workspace) {
    return NextResponse.json({ ok: false, reason: "workspace_not_found" });
  }

  // Attribute the idea to a workspace member if their email matches the
  // sender. Fall back to the owner so the row always has a creator.
  const senderEmail = pickAddress(fromRaw);
  let createdByUserId = workspace.ownerUserId;
  let attributionMatched = false;
  if (senderEmail) {
    const [member] = await db
      .select({ userId: users.id })
      .from(workspaceMembers)
      .innerJoin(users, eq(users.id, workspaceMembers.userId))
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspace.id),
          eq(users.email, senderEmail),
        ),
      )
      .limit(1);
    if (member) {
      createdByUserId = member.userId;
      attributionMatched = true;
    }
  }

  const title = (subjectRaw || "Untitled").trim().slice(0, MAX_TITLE);
  const bodyText = (textRaw || htmlToText(htmlRaw) || "").slice(0, MAX_BODY);

  // Idempotency: if the forwarder retries, dedupe on messageId. We use
  // sourceId for this because it's already indexed semantically and
  // existing source types use it the same way.
  if (messageId) {
    const [dupe] = await db
      .select({ id: ideas.id })
      .from(ideas)
      .where(eq(ideas.sourceId, messageId))
      .limit(1);
    if (dupe) return NextResponse.json({ ok: true, deduped: true });
  }

  const [row] = await db
    .insert(ideas)
    .values({
      createdByUserId,
      workspaceId: workspace.id,
      source: "email",
      sourceId: messageId,
      sourceUrl: null,
      title,
      body: bodyText || "(empty message)",
      media: null,
      tags: [],
      channelFit: [],
      status: "new",
    })
    .returning({ id: ideas.id });

  return NextResponse.json({
    ok: true,
    ideaId: row.id,
    attributionMatched,
  });
}
