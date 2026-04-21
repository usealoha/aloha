"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { trainVoice, type VoiceSliders } from "@/lib/ai/voice";
import { requireMuseAccess } from "@/lib/billing/muse";

const VALID_PERSPECTIVES = [
  "first-person",
  "third-person",
  "mixed",
] as const;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function parsePerspective(v: unknown): VoiceSliders["perspective"] {
  return (VALID_PERSPECTIVES as readonly string[]).includes(String(v))
    ? (v as VoiceSliders["perspective"])
    : "mixed";
}

export async function trainVoiceAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  await requireMuseAccess(user.id);

  const sliders: VoiceSliders = {
    formality: clamp(Number(formData.get("formality") ?? 50), 0, 100),
    detail: clamp(Number(formData.get("detail") ?? 50), 0, 100),
    wit: clamp(Number(formData.get("wit") ?? 50), 0, 100),
    perspective: parsePerspective(formData.get("perspective")),
  };

  const uploadedCorpus = String(formData.get("uploadedCorpus") ?? "").trim();

  const samplePostIds = formData
    .getAll("samplePostIds")
    .map((v) => String(v).trim())
    .filter(Boolean);

  await trainVoice({
    userId: user.id,
    sliders,
    uploadedCorpus: uploadedCorpus || undefined,
    samplePostIds: samplePostIds.length > 0 ? samplePostIds : undefined,
  });

  revalidatePath("/app/settings/muse");
}
