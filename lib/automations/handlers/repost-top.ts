import "server-only";

import { and, desc, eq, gte, isNotNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  platformInsights,
  posts,
  type DraftMeta,
  type PostMedia,
} from "@/db/schema";
import { requireActiveWorkspaceId } from "@/lib/workspaces/resolve";
import { generate } from "@/lib/ai/router";
import { PROMPTS, registerPrompts } from "@/lib/ai/prompts";
import { hasMuseInviteEntitlement } from "@/lib/billing/muse";
import { CostCapExceededError } from "@/lib/ai/cost-cap";
import {
  registerAction,
  type ActionContext,
  type ActionResult,
} from "../registry";

// Config from `scheduled_repost`:
//   {
//     captionMode: "keep" | "rewrite",
//     mode: "top" | "evergreen" | "any"   // default "any"
//   }
// Trigger carries `intervalDays` from the schedule node via `trigger` when
// the dispatcher is aware of it; we fall back to 14 days otherwise. The
// interval also doubles as the "don't re-repost the same winner" window.

const LOOKBACK_DAYS = 60;
const DEFAULT_INTERVAL_DAYS = 14;
// Cool-off between successive resurfaces of the same evergreen post.
// Independent of the config interval — the schedule decides cadence,
// this protects the audience from seeing the same evergreen too often
// even when the schedule fires weekly.
const EVERGREEN_COOLOFF_DAYS = 90;

// Same rank formula `loadPastHighPerformers` uses in campaign.ts so the
// automation picks the winner the user would expect when they see the
// top-performers list elsewhere in the product.
const RANK_SCORE = sql<number>`
  COALESCE(
    NULLIF(${platformInsights.metrics}->>'impressions', '')::bigint,
    (
      COALESCE(NULLIF(${platformInsights.metrics}->>'likes', '')::int, 0)
      + COALESCE(NULLIF(${platformInsights.metrics}->>'replies', '')::int, 0)
      + COALESCE(NULLIF(${platformInsights.metrics}->>'reposts', '')::int, 0)
      + COALESCE(NULLIF(${platformInsights.metrics}->>'quotes', '')::int, 0)
    ) * 100
  )
`;

type WinnerRow = {
  postId: string;
  platform: string;
  score: number;
};

async function loadCandidateWinners(
  userId: string,
  lookbackSince: Date,
): Promise<WinnerRow[]> {
  const workspaceId = await requireActiveWorkspaceId(userId);
  const rows = await db
    .select({
      postId: platformInsights.postId,
      platform: platformInsights.platform,
      score: RANK_SCORE,
    })
    .from(platformInsights)
    .where(
      and(
        eq(platformInsights.workspaceId, workspaceId),
        isNotNull(platformInsights.postId),
        gte(platformInsights.platformPostedAt, lookbackSince),
      ),
    )
    .orderBy(desc(RANK_SCORE))
    .limit(20);

  return rows
    .filter((r): r is WinnerRow => typeof r.postId === "string")
    .map((r) => ({ postId: r.postId, platform: r.platform, score: r.score }));
}

// Posts the user has explicitly opted into resurfacing. Filtered by the
// evergreen cool-off so a single winner doesn't dominate the queue. The
// "platform" we return is just the first platform the post shipped on —
// the rewrite uses it for tone-tuning; the actual resurface clones the
// full platform list from the origin.
async function loadEvergreenCandidates(
  userId: string,
): Promise<WinnerRow[]> {
  const workspaceId = await requireActiveWorkspaceId(userId);
  const cooloffSince = new Date(
    Date.now() - EVERGREEN_COOLOFF_DAYS * 86_400_000,
  );

  const rows = await db
    .select({
      postId: posts.id,
      platforms: posts.platforms,
      evergreenMarkedAt: posts.evergreenMarkedAt,
      lastResurfacedAt: posts.lastResurfacedAt,
    })
    .from(posts)
    .where(
      and(
        eq(posts.workspaceId, workspaceId),
        eq(posts.status, "published"),
        isNotNull(posts.evergreenMarkedAt),
        or(
          // Never resurfaced before, or resurfaced before the cool-off.
          // SQL NULL comparisons would always be false, so split.
          sql`${posts.lastResurfacedAt} IS NULL`,
          lt(posts.lastResurfacedAt, cooloffSince),
        ),
      ),
    )
    // Oldest first — let the slow burners cycle before recently-resurfaced
    // ones. `evergreenMarkedAt` desc would re-prioritize whatever the user
    // touched last; ascending biases toward the back catalog the way a
    // creator typically wants when they batch-mark.
    .orderBy(posts.lastResurfacedAt, desc(posts.evergreenMarkedAt))
    .limit(20);

  return rows
    .filter((r): r is { postId: string; platforms: string[]; evergreenMarkedAt: Date | null; lastResurfacedAt: Date | null } =>
      typeof r.postId === "string" && Array.isArray(r.platforms),
    )
    .map((r) => ({
      postId: r.postId,
      platform: r.platforms[0] ?? "general",
      // Score column is unused for evergreen ranking but kept on the
      // shape so the downstream logic stays uniform.
      score: 0,
    }));
}

async function findRecentRepostSources(
  userId: string,
  since: Date,
): Promise<Set<string>> {
  // Posts created within the current interval that carry a sourcePostId
  // in their draftMeta — those are prior automation outputs, their
  // sources shouldn't be reposted again this window.
  const rows = await db
    .select({ draftMeta: posts.draftMeta })
    .from(posts)
    .where(and(eq(posts.createdByUserId, userId), gte(posts.createdAt, since)));
  const set = new Set<string>();
  for (const r of rows) {
    const src = r.draftMeta?.sourcePostId;
    if (typeof src === "string" && src.length > 0) set.add(src);
  }
  return set;
}

async function rewriteCaption(
  userId: string,
  platform: string,
  original: string,
): Promise<{ text: string; generationId: string } | null> {
  await registerPrompts();
  try {
    const result = await generate({
      userId,
      feature: "composer.refine",
      template: PROMPTS.composerRefine,
      vars: { platform },
      userMessage: `Rewrite this post with a fresh angle — different opening line, different structure, same core idea. Keep it native to the platform. Original:\n\n${original}`,
      temperature: 0.85,
    });
    return { text: result.text.trim(), generationId: result.generationId };
  } catch (err) {
    if (err instanceof CostCapExceededError) return null;
    throw err;
  }
}

registerAction(
  "repost_top",
  async ({ userId, step, trigger }: ActionContext): Promise<ActionResult> => {
    const cfg = step.config ?? {};
    const requestedMode =
      cfg.mode === "top" || cfg.mode === "evergreen" || cfg.mode === "any"
        ? (cfg.mode as "top" | "evergreen" | "any")
        : "any";
    // Evergreen-marked posts default to a fresh-caption pass — the whole
    // point is the audience sees a new spin. Top-only posts respect the
    // user's keep/rewrite choice so cost stays predictable.
    const explicitCaption = cfg.captionMode;
    const captionMode =
      explicitCaption === "keep" || explicitCaption === "rewrite"
        ? (explicitCaption as "keep" | "rewrite")
        : requestedMode === "top"
          ? "keep"
          : "rewrite";

    const rawInterval =
      typeof cfg.intervalDays === "string"
        ? cfg.intervalDays
        : typeof trigger.intervalDays === "string"
          ? trigger.intervalDays
          : null;
    const intervalDays = rawInterval
      ? Math.max(1, Number.parseInt(rawInterval, 10) || DEFAULT_INTERVAL_DAYS)
      : DEFAULT_INTERVAL_DAYS;

    const lookbackSince = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000);
    const intervalSince = new Date(Date.now() - intervalDays * 86_400_000);

    const [topCandidates, evergreenCandidates, alreadyReposted] =
      await Promise.all([
        requestedMode === "evergreen"
          ? Promise.resolve([])
          : loadCandidateWinners(userId, lookbackSince),
        requestedMode === "top"
          ? Promise.resolve([])
          : loadEvergreenCandidates(userId),
        findRecentRepostSources(userId, intervalSince),
      ]);

    // Resolution order: evergreen first (creator-curated), then top
    // (data-curated). The "any" mode falls back gracefully when one
    // pool is empty.
    let winner: WinnerRow | undefined;
    let chosenSource: "evergreen" | "top";
    const evergreenPick = evergreenCandidates.find(
      (c) => !alreadyReposted.has(c.postId),
    );
    if (evergreenPick) {
      winner = evergreenPick;
      chosenSource = "evergreen";
    } else {
      const topPick = topCandidates.find((c) => !alreadyReposted.has(c.postId));
      if (topPick) {
        winner = topPick;
        chosenSource = "top";
      } else {
        return {
          output: {
            skipped: true,
            reason:
              evergreenCandidates.length === 0 && topCandidates.length === 0
                ? "No eligible posts (no evergreen marks, no insights)"
                : "All eligible posts have been resurfaced recently",
            mode: requestedMode,
            lookbackDays: LOOKBACK_DAYS,
            intervalDays,
            evergreenConsidered: evergreenCandidates.length,
            topConsidered: topCandidates.length,
          },
        };
      }
    }

    // Load the source post locally — we need content, media, and the
    // original platforms list to clone.
    const [source] = await db
      .select({
        id: posts.id,
        content: posts.content,
        platforms: posts.platforms,
        media: posts.media,
      })
      .from(posts)
      .where(and(eq(posts.id, winner.postId), eq(posts.createdByUserId, userId)))
      .limit(1);

    if (!source) {
      return {
        output: {
          skipped: true,
          reason: "Winner post not found in local table (possibly deleted)",
          winnerId: winner.postId,
        },
      };
    }

    let body = source.content;
    let generationId: string | null = null;

    if (captionMode === "rewrite") {
      const hasMuse = await hasMuseInviteEntitlement(userId);
      if (hasMuse) {
        const rewritten = await rewriteCaption(
          userId,
          winner.platform,
          source.content,
        );
        if (rewritten) {
          body = rewritten.text;
          generationId = rewritten.generationId;
        }
        // If rewrite returned null (cost cap hit), we fall through to the
        // original caption rather than skip the repost — the user still
        // gets their winner back on the calendar.
      }
    }

    const sourceLabel =
      chosenSource === "evergreen" ? "evergreen pick" : "top performer";
    const draftMeta: DraftMeta = {
      sourcePostId: source.id,
      rationale:
        captionMode === "rewrite" && generationId
          ? `Resurfaced ${sourceLabel} — caption rewritten`
          : `Resurfaced ${sourceLabel} — original caption kept`,
    };

    const workspaceId = await requireActiveWorkspaceId(userId);
    const [row] = await db
      .insert(posts)
      .values({
        createdByUserId: userId,
        workspaceId,
        content: body,
        platforms: source.platforms,
        media: source.media as PostMedia[],
        status: "draft",
        draftMeta,
        parentPostId: source.id,
      })
      .returning({ id: posts.id });

    // Stamp the origin so the next pass respects the cool-off and the
    // detail UI can show "last resurfaced 14d ago".
    await db
      .update(posts)
      .set({ lastResurfacedAt: new Date(), updatedAt: new Date() })
      .where(eq(posts.id, source.id));

    return {
      output: {
        postId: row.id,
        sourcePostId: source.id,
        chosenSource,
        platform: winner.platform,
        platforms: source.platforms,
        score: winner.score,
        captionMode,
        rewritten: captionMode === "rewrite" && generationId !== null,
        generationId,
      },
    };
  },
);
