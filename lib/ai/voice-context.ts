// Voice + platform context helpers shared by composer generation,
// per-channel variants, and the repurposer. Pulls the trained `brand_voice`
// row and shapes it into a prose block that every `composer.*` prompt
// templates consume via the {{voiceBlock}} substitution.

import type { VoiceChannelDelta, VoiceProfile } from "./voice";

type VoiceRow = {
  tone: unknown;
  features: unknown;
  bannedPhrases: string[];
  ctaStyle: string | null;
  emojiRate: string | null;
};

export const PLATFORM_CONSTRAINTS: Record<string, string> = {
  twitter: "280 characters max. Single post (not a thread). Punchy hook.",
  linkedin:
    "Up to 3000 characters. Hook, 2-3 beats, optional question close. No theatrical line breaks unless the voice profile warrants them.",
  facebook: "Long-form OK. Lead with the headline thought.",
  instagram:
    "Caption up to 2200 characters. Warm first line, line break after the hook.",
  threads: "Up to 500 characters. Conversational, not performative.",
  tiktok:
    "Caption up to 2200 characters but prefer short. Pairs with a video — caption is footer, not message.",
  bluesky: "300 characters recommended. Authentic, not performative.",
  medium: "Long-form article OK. Start with insight, not a hook.",
  reddit:
    "Respect the community's norms. No marketing cadence. Short title if title post.",
  general: "Keep under 500 characters. Neutral, platform-agnostic.",
};

export function constraintsFor(platform: string): string {
  return PLATFORM_CONSTRAINTS[platform] ?? PLATFORM_CONSTRAINTS.general;
}

export function buildVoiceBlock(
  voice: VoiceRow | null,
  channelDelta?: VoiceChannelDelta | null,
  channel?: string,
): string {
  const baseBlock = buildBaseVoiceBlock(voice);
  if (!channelDelta || !channel) return baseBlock;
  const overrideBlock = buildChannelOverrideBlock(channelDelta, channel);
  return overrideBlock ? `${baseBlock}\n\n${overrideBlock}` : baseBlock;
}

function buildBaseVoiceBlock(voice: VoiceRow | null): string {
  if (!voice) {
    return "(No voice profile trained yet. Write in a neutral, direct tone.)";
  }

  const tone = (voice.tone ?? {}) as {
    summary?: string;
    descriptors?: string[];
  };
  const features = (voice.features ?? {}) as {
    hook_patterns?: string[];
    cadence?: VoiceProfile["cadence"];
    positive_examples?: string[];
  };

  const parts: string[] = [];
  if (tone.summary) parts.push(`Summary: ${tone.summary}`);
  if (tone.descriptors?.length)
    parts.push(`Tone: ${tone.descriptors.join(", ")}`);
  if (features.hook_patterns?.length)
    parts.push(`Hook patterns: ${features.hook_patterns.join(" / ")}`);
  if (features.cadence) {
    const c = features.cadence;
    const bits: string[] = [];
    if (c.avg_sentence_length_words)
      bits.push(`avg sentence ~${c.avg_sentence_length_words} words`);
    if (c.sentence_variance) bits.push(`variance: ${c.sentence_variance}`);
    if (c.paragraph_breaks) bits.push(`paragraph breaks: ${c.paragraph_breaks}`);
    if (bits.length) parts.push(`Cadence: ${bits.join("; ")}`);
  }
  if (voice.ctaStyle) parts.push(`CTA style: ${voice.ctaStyle}`);
  if (voice.emojiRate) parts.push(`Emoji rate: ${voice.emojiRate}`);
  if (voice.bannedPhrases.length)
    parts.push(`Never use: ${voice.bannedPhrases.join(", ")}`);
  if (features.positive_examples?.length) {
    parts.push("Positive examples (tone, not topics):");
    for (const ex of features.positive_examples.slice(0, 3)) {
      parts.push(`  - ${ex}`);
    }
  }

  return parts.length > 0
    ? parts.join("\n")
    : "(Voice profile trained but sparse — treat as neutral.)";
}

function buildChannelOverrideBlock(
  delta: VoiceChannelDelta,
  channel: string,
): string {
  const parts: string[] = [];
  parts.push(`Channel-specific overrides for ${channel} (apply on top of the above — these take precedence where they conflict):`);
  if (delta.summary) parts.push(`How it differs: ${delta.summary}`);
  if (delta.tone_descriptors?.length)
    parts.push(`Tone (this channel): ${delta.tone_descriptors.join(", ")}`);
  if (delta.hook_patterns?.length)
    parts.push(`Hook patterns (this channel): ${delta.hook_patterns.join(" / ")}`);
  if (delta.cta_style) parts.push(`CTA style (this channel): ${delta.cta_style}`);
  if (delta.emoji_rate) parts.push(`Emoji rate (this channel): ${delta.emoji_rate}`);
  if (delta.banned_phrases?.length)
    parts.push(`Also never use (this channel): ${delta.banned_phrases.join(", ")}`);
  if (delta.positive_examples?.length) {
    parts.push("Channel-native examples:");
    for (const ex of delta.positive_examples.slice(0, 3)) {
      parts.push(`  - ${ex}`);
    }
  }
  // Only the header line? Nothing meaningful to add — skip the block entirely.
  return parts.length > 1 ? parts.join("\n") : "";
}
