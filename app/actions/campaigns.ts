"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { CostCapExceededError } from "@/lib/ai/cost-cap";
import {
  CAMPAIGN_KINDS,
  composeBeatBody,
  formatGuidanceFor,
  generateCampaign,
  isCadenceKind,
  loadCampaign,
  markBeatAccepted,
  regenerateCampaignBeat,
  type CampaignKind,
} from "@/lib/ai/campaign";
import { getCurrentUser } from "@/lib/current-user";

const isKind = (v: unknown): v is CampaignKind =>
  typeof v === "string" && (CAMPAIGN_KINDS as readonly string[]).includes(v);

const parseStringList = (raw: string): string[] =>
  raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export async function createCampaignAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const name = String(formData.get("name") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();
  const kindRaw = formData.get("kind");
  if (!goal) throw new Error("Goal is required.");
  if (!isKind(kindRaw)) throw new Error("Pick a campaign kind.");

  const channels = formData
    .getAll("channels")
    .map((v) => String(v).trim())
    .filter(Boolean);
  if (channels.length === 0) throw new Error("Pick at least one channel.");

  const rangeStartStr = String(formData.get("rangeStart") ?? "").trim();
  const rangeEndStr = String(formData.get("rangeEnd") ?? "").trim();
  if (!rangeStartStr || !rangeEndStr) throw new Error("Pick a date range.");
  const rangeStart = new Date(`${rangeStartStr}T00:00:00Z`);
  const rangeEnd = new Date(`${rangeEndStr}T23:59:59Z`);

  // Themes + postsPerWeek only matter for cadence kinds. For arc kinds we
  // pass empty/null so the campaign row stays consistent with its shape.
  const cadence = isCadenceKind(kindRaw);
  const themes = cadence
    ? parseStringList(String(formData.get("themes") ?? ""))
    : [];
  const postsPerWeek = cadence
    ? Math.max(1, Math.min(14, Number(formData.get("postsPerWeek") ?? 5)))
    : null;

  let campaignId: string;
  try {
    const campaign = await generateCampaign({
      userId: user.id,
      name,
      goal,
      kind: kindRaw,
      channels,
      themes,
      postsPerWeek,
      rangeStart,
      rangeEnd,
    });
    campaignId = campaign.campaignId;
  } catch (err) {
    if (err instanceof CostCapExceededError) throw err;
    throw err;
  }

  revalidatePath("/app/campaigns");
  redirect(`/app/campaigns/${campaignId}`);
}

// Accepts one or more beats: one draft post per beat, campaignId stamped
// on the post for provenance + calendar tinting, scheduled for noon UTC on
// the beat's date. Cadence beats carry rich scaffolding (hook, keyPoints,
// cta, hashtags, mediaSuggestion, rationale) into `draftMeta` so the
// composer sidebar lights up the same way it does for Muse-drafted posts.
// User tunes the time in composer.
export async function acceptCampaignBeatsAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const campaignId = String(formData.get("campaignId") ?? "");
  const beatIds = formData
    .getAll("beatIds")
    .map((v) => String(v).trim())
    .filter(Boolean);
  if (!campaignId || beatIds.length === 0) {
    throw new Error("Pick at least one beat to accept.");
  }

  const campaign = await loadCampaign(user.id, campaignId);
  if (!campaign) throw new Error("Campaign not found.");

  for (const beat of campaign.beats) {
    if (!beatIds.includes(beat.id)) continue;
    if (beat.accepted) continue;

    const scheduledAt = new Date(`${beat.date}T12:00:00Z`);
    const content = composeBeatBody(beat);
    const draftMeta = {
      ...(beat.hook ? { hook: beat.hook } : {}),
      ...(beat.keyPoints && beat.keyPoints.length > 0
        ? { keyPoints: beat.keyPoints }
        : {}),
      ...(beat.cta ? { cta: beat.cta } : {}),
      ...(beat.hashtags && beat.hashtags.length > 0
        ? { hashtags: beat.hashtags }
        : {}),
      ...(beat.mediaSuggestion ? { mediaSuggestion: beat.mediaSuggestion } : {}),
      ...(beat.rationale ? { rationale: beat.rationale } : {}),
      format: beat.format,
      formatGuidance: formatGuidanceFor(beat.format, beat.channel),
    };
    const [post] = await db
      .insert(posts)
      .values({
        userId: user.id,
        content,
        platforms: [beat.channel],
        status: "draft",
        scheduledAt,
        campaignId: campaign.id,
        draftMeta: Object.keys(draftMeta).length > 0 ? draftMeta : null,
      })
      .returning({ id: posts.id });
    await markBeatAccepted(campaignId, beat.id, post.id);
  }

  revalidatePath(`/app/campaigns/${campaignId}`);
  revalidatePath("/app/calendar");
  redirect(`/app/campaigns/${campaignId}?accepted=1`);
}

export async function regenerateCampaignBeatAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const campaignId = String(formData.get("campaignId") ?? "");
  const beatId = String(formData.get("beatId") ?? "");
  if (!campaignId || !beatId) throw new Error("campaignId and beatId required");

  try {
    await regenerateCampaignBeat(user.id, campaignId, beatId);
  } catch (err) {
    if (err instanceof CostCapExceededError) throw err;
    throw err;
  }

  revalidatePath(`/app/campaigns/${campaignId}`);
  redirect(`/app/campaigns/${campaignId}`);
}
