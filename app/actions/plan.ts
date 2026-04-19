"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { CostCapExceededError } from "@/lib/ai/cost-cap";
import {
  generatePlan,
  loadPlan,
  markIdeaAccepted,
  regeneratePlanDay,
  type PlanIdea,
} from "@/lib/ai/plan";
import { getCurrentUser } from "@/lib/current-user";

// Builds the editor-ready body from a plan idea. Falls back to
// title + angle for legacy (v1) ideas that have none of the richer fields.
function composeDraftBody(idea: PlanIdea): string {
  const hasRicher =
    idea.hook || (idea.keyPoints && idea.keyPoints.length > 0) || idea.cta;
  if (!hasRicher) {
    return idea.title + (idea.angle ? `\n\n${idea.angle}` : "");
  }
  const parts: string[] = [];
  if (idea.hook) parts.push(idea.hook);
  if (idea.keyPoints && idea.keyPoints.length > 0) {
    // Thread/carousel formats read better as numbered beats; single/long-form
    // flow as paragraphs.
    const isBeatFormat =
      idea.format === "thread" || idea.format === "carousel";
    parts.push(
      isBeatFormat
        ? idea.keyPoints.map((k, i) => `${i + 1}. ${k}`).join("\n")
        : idea.keyPoints.join("\n\n"),
    );
  }
  if (idea.cta) parts.push(idea.cta);
  if (idea.hashtags && idea.hashtags.length > 0) {
    parts.push(idea.hashtags.join(" "));
  }
  return parts.join("\n\n");
}

// Short human-readable format hint shown in the composer sidebar. Not prompt
// context — just UI copy.
function formatGuidanceFor(format: string, channel: string): string {
  switch (format) {
    case "thread":
      return `Thread on ${channel} — each beat is one post, hook carries the reader to the next.`;
    case "carousel":
      return `Carousel — each beat is one slide, big type, one idea per card.`;
    case "long-form":
      return `Long-form — headline + scannable sections, aim for depth over brevity.`;
    case "short-video":
      return `Short video — hook in the first 3s, beats pace the script, caption is the CTA.`;
    case "link":
      return `Link post — framing sits outside the preview, let the link title do work.`;
    default:
      return `Single post — hook, payoff, close. Tight.`;
  }
}

function parseStringList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function createPlanAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const goal = String(formData.get("goal") ?? "").trim();
  if (!goal) throw new Error("Goal is required.");

  const themes = parseStringList(String(formData.get("themes") ?? ""));
  const channels = formData
    .getAll("channels")
    .map((v) => String(v).trim())
    .filter(Boolean);
  if (channels.length === 0) throw new Error("Pick at least one channel.");

  const frequency = Math.max(
    1,
    Math.min(14, Number(formData.get("frequency") ?? 5)),
  );
  const rangeStartStr = String(formData.get("rangeStart") ?? "").trim();
  const rangeEndStr = String(formData.get("rangeEnd") ?? "").trim();
  if (!rangeStartStr || !rangeEndStr) throw new Error("Pick a date range.");
  const rangeStart = new Date(`${rangeStartStr}T00:00:00Z`);
  const rangeEnd = new Date(`${rangeEndStr}T23:59:59Z`);

  let planId: string;
  try {
    const plan = await generatePlan({
      userId: user.id,
      goal,
      themes,
      channels,
      frequency,
      rangeStart,
      rangeEnd,
    });
    planId = plan.planId;
  } catch (err) {
    if (err instanceof CostCapExceededError) throw err;
    throw err;
  }

  revalidatePath("/app/calendar/plan");
  redirect(`/app/calendar/plan?id=${planId}`);
}

// Accepts one or more ideas from a plan: creates a draft `posts` row per
// accepted idea, scheduled for noon UTC on the proposed date (user can
// adjust in the composer), and back-refs the draft into the plan.
export async function acceptPlanIdeasAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const planId = String(formData.get("planId") ?? "");
  const ideaIds = formData
    .getAll("ideaIds")
    .map((v) => String(v).trim())
    .filter(Boolean);
  if (!planId || ideaIds.length === 0) {
    throw new Error("Pick at least one idea to accept.");
  }

  const plan = await loadPlan(user.id, planId);
  if (!plan) throw new Error("Plan not found.");

  for (const idea of plan.ideas) {
    if (!ideaIds.includes(idea.id)) continue;
    if (idea.accepted) continue;

    // Noon UTC on the proposed day — a neutral default; the user tunes the
    // exact minute in the composer.
    const scheduledAt = new Date(`${idea.date}T12:00:00Z`);
    const content = composeDraftBody(idea);
    const draftMeta = {
      ...(idea.hook ? { hook: idea.hook } : {}),
      ...(idea.keyPoints && idea.keyPoints.length > 0
        ? { keyPoints: idea.keyPoints }
        : {}),
      ...(idea.cta ? { cta: idea.cta } : {}),
      ...(idea.hashtags && idea.hashtags.length > 0
        ? { hashtags: idea.hashtags }
        : {}),
      ...(idea.mediaSuggestion ? { mediaSuggestion: idea.mediaSuggestion } : {}),
      ...(idea.rationale ? { rationale: idea.rationale } : {}),
      format: idea.format,
      formatGuidance: formatGuidanceFor(idea.format, idea.channel),
    };
    const [post] = await db
      .insert(posts)
      .values({
        userId: user.id,
        content,
        platforms: [idea.channel],
        status: "draft",
        scheduledAt,
        draftMeta: Object.keys(draftMeta).length > 0 ? draftMeta : null,
      })
      .returning({ id: posts.id });
    await markIdeaAccepted(planId, idea.id, post.id);
  }

  revalidatePath("/app/calendar/plan");
  redirect(`/app/calendar/plan?id=${planId}&accepted=1`);
}

export async function regeneratePlanDayAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const planId = String(formData.get("planId") ?? "");
  const date = String(formData.get("date") ?? "");
  if (!planId || !date) throw new Error("planId and date required");

  try {
    await regeneratePlanDay(user.id, planId, date);
  } catch (err) {
    if (err instanceof CostCapExceededError) throw err;
    throw err;
  }

  revalidatePath("/app/calendar/plan");
  redirect(`/app/calendar/plan?id=${planId}`);
}
