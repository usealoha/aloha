// Brand-voice training pipeline. Takes slider state + optional uploaded
// corpus + optional sample IDs from platform_content_cache, runs the
// `voice.train` template, parses the structured JSON, and persists into
// `brand_voice`. Called from the settings Muse tab server action.
//
// Design notes:
//  - Uploaded corpus is in-request (no corpus table yet — the plan calls it
//    `brand_corpus` but adding the table isn't blocking voice v1; upload
//    flows straight into the training call).
//  - Sample IDs reference `platform_content_cache.id`. If none passed, we
//    auto-pick the most recent N across all connected platforms.
//  - Corpus is truncated to fit the model context. We don't paginate across
//    multiple calls yet — the Pro model's window handles a few hundred
//    posts comfortably.

import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { brandCorpus, brandVoice, platformContentCache } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PROMPTS, registerPrompts } from "./prompts";
import { generate } from "./router";

export type VoiceSliders = {
  formality: number; // 0-100
  detail: number; // 0-100
  wit: number; // 0-100
  perspective: "first-person" | "third-person" | "mixed";
};

export type VoiceProfile = {
  summary: string;
  tone_descriptors: string[];
  hook_patterns: string[];
  cta_style: string;
  cadence: {
    avg_sentence_length_words: number;
    sentence_variance: "tight" | "moderate" | "varied";
    paragraph_breaks: "frequent" | "moderate" | "sparse";
  };
  emoji_rate: "none" | "low" | "medium" | "high";
  banned_phrases: string[];
  positive_examples: string[];
};

// Cap on corpus tokens sent to the trainer. Gemini Pro handles ~1M tokens
// but we keep the training call tight so latency + cost stay predictable.
// ~50k chars ≈ 12k tokens.
const MAX_CORPUS_CHARS = 50_000;
const AUTO_SAMPLE_LIMIT = 100;

export type TrainVoiceInput = {
  userId: string;
  sliders: VoiceSliders;
  uploadedCorpus?: string;
  // Explicit picks from platform_content_cache. If empty/undefined, we pull
  // the most recent AUTO_SAMPLE_LIMIT posts for the user.
  samplePostIds?: string[];
};

export type TrainVoiceResult = {
  profile: VoiceProfile;
  generationId: string;
  corpusSize: number;
  sampleCount: number;
};

export async function trainVoice(
  input: TrainVoiceInput,
): Promise<TrainVoiceResult> {
  await registerPrompts();

  const [samples, corpusDocs] = await Promise.all([
    loadCorpusSamples(input.userId, input.samplePostIds),
    loadBrandCorpusForTraining(input.userId),
  ]);
  const corpus = assembleCorpus(samples, corpusDocs, input.uploadedCorpus);

  const result = await generate({
    userId: input.userId,
    feature: "voice.train",
    template: PROMPTS.voiceTrain,
    vars: {
      formality: String(input.sliders.formality),
      detail: String(input.sliders.detail),
      wit: String(input.sliders.wit),
      perspective: input.sliders.perspective,
    },
    userMessage: corpus,
    temperature: 0.3,
  });

  const profile = parseVoiceProfile(result.text);

  await persistVoiceProfile(input.userId, profile, samples.map((s) => s.id));

  return {
    profile,
    generationId: result.generationId,
    corpusSize: corpus.length,
    sampleCount: samples.length,
  };
}

async function loadCorpusSamples(
  userId: string,
  ids: string[] | undefined,
) {
  if (ids && ids.length > 0) {
    return db
      .select({
        id: platformContentCache.id,
        platform: platformContentCache.platform,
        content: platformContentCache.content,
      })
      .from(platformContentCache)
      .where(inArray(platformContentCache.id, ids));
  }
  return db
    .select({
      id: platformContentCache.id,
      platform: platformContentCache.platform,
      content: platformContentCache.content,
    })
    .from(platformContentCache)
    .where(eq(platformContentCache.userId, userId))
    .limit(AUTO_SAMPLE_LIMIT);
}

type Sample = { id: string; platform: string; content: string };
type CorpusDoc = { source: string; title: string | null; content: string };

async function loadBrandCorpusForTraining(userId: string): Promise<CorpusDoc[]> {
  return db
    .select({
      source: brandCorpus.source,
      title: brandCorpus.title,
      content: brandCorpus.content,
    })
    .from(brandCorpus)
    .where(eq(brandCorpus.userId, userId));
}

function assembleCorpus(
  samples: Sample[],
  docs: CorpusDoc[],
  uploaded: string | undefined,
): string {
  const blocks: string[] = [];

  if (samples.length > 0) {
    blocks.push(
      "--- Sample posts (your own writing from connected platforms) ---",
    );
    for (const s of samples) {
      blocks.push(`[${s.platform}] ${s.content}`);
    }
  }

  if (docs.length > 0) {
    blocks.push(
      "--- Long-form corpus (your writing workspace — Notion, Docs, uploads) ---",
    );
    for (const d of docs) {
      const header = d.title ? `[${d.source}] ${d.title}` : `[${d.source}]`;
      blocks.push(`${header}\n${d.content}`);
    }
  }

  if (uploaded && uploaded.trim()) {
    blocks.push("--- Additional corpus (pasted) ---");
    blocks.push(uploaded.trim());
  }

  if (blocks.length === 0) {
    blocks.push(
      "(No corpus provided. Produce a slider-derived baseline profile.)",
    );
  }

  const joined = blocks.join("\n\n");
  return joined.length > MAX_CORPUS_CHARS
    ? joined.slice(0, MAX_CORPUS_CHARS) + "\n\n[...truncated]"
    : joined;
}

function parseVoiceProfile(text: string): VoiceProfile {
  // Models sometimes wrap JSON in fences despite instructions. Strip them.
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      "Voice trainer returned non-JSON output. Retry or check prompt.",
    );
  }

  // Shallow validation — enough to fail loudly instead of silently writing
  // garbage. The prompt holds the real contract.
  const p = parsed as Partial<VoiceProfile>;
  if (
    typeof p.summary !== "string" ||
    !Array.isArray(p.tone_descriptors) ||
    !p.cadence ||
    typeof p.emoji_rate !== "string"
  ) {
    throw new Error("Voice profile JSON missing required fields.");
  }
  return parsed as VoiceProfile;
}

async function persistVoiceProfile(
  userId: string,
  profile: VoiceProfile,
  sampleIds: string[],
) {
  await db
    .insert(brandVoice)
    .values({
      userId,
      tone: { summary: profile.summary, descriptors: profile.tone_descriptors },
      features: {
        hook_patterns: profile.hook_patterns,
        cadence: profile.cadence,
        positive_examples: profile.positive_examples,
      },
      bannedPhrases: profile.banned_phrases ?? [],
      ctaStyle: profile.cta_style ?? null,
      emojiRate: profile.emoji_rate,
      sampleSourceIds: sampleIds,
      trainedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: brandVoice.userId,
      set: {
        tone: { summary: profile.summary, descriptors: profile.tone_descriptors },
        features: {
          hook_patterns: profile.hook_patterns,
          cadence: profile.cadence,
          positive_examples: profile.positive_examples,
        },
        bannedPhrases: profile.banned_phrases ?? [],
        ctaStyle: profile.cta_style ?? null,
        emojiRate: profile.emoji_rate,
        sampleSourceIds: sampleIds,
        trainedAt: new Date(),
        updatedAt: new Date(),
      },
    });
}

export async function loadCurrentVoice(userId: string) {
  const [row] = await db
    .select()
    .from(brandVoice)
    .where(eq(brandVoice.userId, userId))
    .limit(1);
  return row ?? null;
}
