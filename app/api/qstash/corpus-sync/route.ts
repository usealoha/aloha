// Daily Notion corpus sync. Schedule in QStash at a fixed UTC hour (suggest
// 04:00 UTC — off-peak for Notion's API). Every run iterates connected
// Notion accounts and pulls their latest shared pages into `brand_corpus`.
//
// Schedule setup (one-time):
//   POST https://qstash.upstash.io/v2/schedules/{APP_URL}/api/qstash/corpus-sync
//   cron: "0 4 * * *"
//
// Per-account failures are captured in the returned outcomes; the response
// is always 200 so QStash doesn't retry the whole batch on a single bad
// token.

import { Receiver } from "@upstash/qstash";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { syncAllNotionAccounts } from "@/lib/notion";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const signature = req.headers.get("upstash-signature");
  if (!signature) {
    return new NextResponse("Missing signature", { status: 401 });
  }

  const receiver = new Receiver({
    currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
  });

  const body = await req.text();
  const isValid = await receiver.verify({ signature, body }).catch(() => false);
  if (!isValid) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const startedAt = Date.now();
  const outcomes = await syncAllNotionAccounts();
  const durationMs = Date.now() - startedAt;

  const summary = {
    durationMs,
    total: outcomes.length,
    ok: outcomes.filter((o) => o.status === "ok").length,
    reauth: outcomes.filter((o) => o.status === "reauth").length,
    failed: outcomes.filter((o) => o.status === "failed").length,
    totalChars: outcomes.reduce((s, o) => s + o.totalChars, 0),
  };
  console.log("[corpus-sync] summary", summary);
  return NextResponse.json({ ok: true, summary, outcomes });
}
