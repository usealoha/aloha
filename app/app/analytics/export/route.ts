import { and, asc, eq, gte, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { platformInsights, posts } from "@/db/schema";
import { analyticsRetentionCutoff } from "@/lib/analytics/retention";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

// All readback metric keys we might see across adapters. Unknown keys are
// still exported as extra columns — we collect the full set before writing
// headers so the CSV is lossless.
const BASE_COLUMNS = [
  "platform_posted_at",
  "platform",
  "remote_post_id",
  "post_id",
  "content",
] as const;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      platform: platformInsights.platform,
      remotePostId: platformInsights.remotePostId,
      postId: platformInsights.postId,
      metrics: platformInsights.metrics,
      platformPostedAt: platformInsights.platformPostedAt,
    })
    .from(platformInsights)
    .where(
      and(
        eq(platformInsights.userId, user.id),
        gte(platformInsights.platformPostedAt, analyticsRetentionCutoff()),
      ),
    )
    .orderBy(asc(platformInsights.platformPostedAt));

  const postIds = Array.from(
    new Set(rows.map((r) => r.postId).filter((id): id is string => !!id)),
  );
  const contentById = new Map<string, string>();
  if (postIds.length > 0) {
    const postRows = await db
      .select({ id: posts.id, content: posts.content })
      .from(posts)
      .where(inArray(posts.id, postIds));
    for (const p of postRows) contentById.set(p.id, p.content);
  }

  const metricKeys = new Set<string>();
  for (const r of rows) {
    for (const k of Object.keys(r.metrics ?? {})) metricKeys.add(k);
  }
  const metricCols = Array.from(metricKeys).sort();

  const headers = [...BASE_COLUMNS, ...metricCols];
  const lines = [headers.join(",")];
  for (const r of rows) {
    const content = r.postId ? (contentById.get(r.postId) ?? "") : "";
    const base = [
      r.platformPostedAt?.toISOString() ?? "",
      r.platform,
      r.remotePostId,
      r.postId ?? "",
      content,
    ];
    const metrics = metricCols.map((k) => {
      const v = r.metrics?.[k];
      return typeof v === "number" ? String(v) : "";
    });
    lines.push([...base, ...metrics].map(csvEscape).join(","));
  }

  const csv = lines.join("\n");
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aloha-analytics-${stamp}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}

function csvEscape(value: string): string {
  if (value === "") return "";
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
