import "server-only";

import { PROMPTS, registerPrompts } from "./prompts";
import { generate } from "./router";
import { loadCurrentVoice } from "./voice";
import { buildVoiceBlock } from "./voice-context";

export type BroadcastDraft = {
  subject: string;
  preheader: string;
  body: string;
};

export type GeneratedBroadcastDraft = BroadcastDraft & {
  generationId: string;
};

// Strips ```json fences if the model added them despite being told not to.
// Gemini sometimes does this even with strict-JSON instructions.
function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function coerceDraft(raw: unknown): BroadcastDraft {
  if (!raw || typeof raw !== "object") {
    throw new Error("Draft response wasn't an object.");
  }
  const obj = raw as Record<string, unknown>;
  const subject = typeof obj.subject === "string" ? obj.subject : "";
  const preheader = typeof obj.preheader === "string" ? obj.preheader : "";
  const body = typeof obj.body === "string" ? obj.body : "";
  if (!subject.trim() || !body.trim()) {
    throw new Error("Draft is missing a subject or body.");
  }
  return { subject: subject.trim(), preheader: preheader.trim(), body };
}

export async function generateBroadcastDraft(opts: {
  userId: string;
  brief: string;
}): Promise<GeneratedBroadcastDraft> {
  await registerPrompts();
  const voice = await loadCurrentVoice(opts.userId);
  const voiceBlock = buildVoiceBlock(voice);

  const result = await generate({
    userId: opts.userId,
    feature: "broadcast.draft",
    template: {
      name: PROMPTS.broadcastDraft.name,
      version: PROMPTS.broadcastDraft.version,
    },
    vars: {
      brief: opts.brief,
      voiceBlock,
    },
    userMessage: opts.brief,
    temperature: 0.8,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFences(result.text));
  } catch {
    throw new Error("Draft didn't come back as JSON. Try again.");
  }

  const draft = coerceDraft(parsed);
  return { ...draft, generationId: result.generationId };
}
