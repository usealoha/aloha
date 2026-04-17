// The one façade every AI feature goes through. Feature code names a feature
// key and a template; the router picks the model, calls OpenRouter, logs the
// result, and returns the text plus a generation id for later feedback.
//
// Swapping which model backs a feature is a one-line edit in `./models.ts`.
// Feature code should never import a model slug directly.

import { costMicrosFor, defaultModelFor, type FeatureKey } from "./models";
import { openRouterChat } from "./openrouter";
import { loadTemplate } from "./templates";
import { logGeneration } from "./generations";

export type GenerateInput = {
  userId: string;
  feature: FeatureKey;
  template: { name: string; version: number };
  // Interpolated into the system prompt via `{{var}}` substitution.
  vars?: Record<string, string>;
  userMessage: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

export type GenerateResult = {
  text: string;
  generationId: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costMicros: number;
  latencyMs: number;
};

export async function generate(input: GenerateInput): Promise<GenerateResult> {
  const model = input.model ?? defaultModelFor(input.feature);
  const template = await loadTemplate(input.template.name, input.template.version);
  const systemPrompt = interpolate(template.systemPrompt, input.vars ?? {});

  const start = Date.now();
  try {
    const { text, tokensIn, tokensOut, raw } = await openRouterChat({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input.userMessage },
      ],
      temperature: input.temperature,
      maxTokens: input.maxTokens,
    });
    const latencyMs = Date.now() - start;
    const costMicros = costMicrosFor(model, tokensIn, tokensOut);

    const generationId = await logGeneration({
      userId: input.userId,
      feature: input.feature,
      templateName: template.name,
      templateVersion: template.version,
      model,
      input: { vars: input.vars ?? {}, userMessage: input.userMessage },
      output: { text, raw },
      tokensIn,
      tokensOut,
      costMicros,
      latencyMs,
      status: "ok",
    });

    return {
      text,
      generationId,
      model,
      tokensIn,
      tokensOut,
      costMicros,
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    await logGeneration({
      userId: input.userId,
      feature: input.feature,
      templateName: template.name,
      templateVersion: template.version,
      model,
      input: { vars: input.vars ?? {}, userMessage: input.userMessage },
      output: {},
      tokensIn: 0,
      tokensOut: 0,
      costMicros: 0,
      latencyMs,
      status: "error",
      errorMessage: message,
    });
    throw err;
  }
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) =>
    key in vars ? vars[key] : "",
  );
}
