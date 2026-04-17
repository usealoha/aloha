// Structured logging for every LLM call. One insert per call. Router owns
// the happy path; feature code can attach user feedback later via
// `recordFeedback` keyed on the generation id the router returns.

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { generations } from "@/db/schema";

export type LogGenerationInput = {
  userId: string;
  feature: string;
  templateName?: string;
  templateVersion?: number;
  model: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  tokensIn: number;
  tokensOut: number;
  costMicros: number;
  latencyMs: number;
  status: "ok" | "error" | "moderated";
  errorCode?: string;
  errorMessage?: string;
};

export async function logGeneration(
  entry: LogGenerationInput,
): Promise<string> {
  const [row] = await db
    .insert(generations)
    .values({
      userId: entry.userId,
      feature: entry.feature,
      templateName: entry.templateName,
      templateVersion: entry.templateVersion,
      model: entry.model,
      input: entry.input,
      output: entry.output,
      tokensIn: entry.tokensIn,
      tokensOut: entry.tokensOut,
      costMicros: entry.costMicros,
      latencyMs: entry.latencyMs,
      status: entry.status,
      errorCode: entry.errorCode,
      errorMessage: entry.errorMessage?.slice(0, 2000),
    })
    .returning({ id: generations.id });
  return row.id;
}

export async function recordFeedback(
  generationId: string,
  feedback: "accepted" | "edited" | "rejected",
): Promise<void> {
  await db
    .update(generations)
    .set({ feedback, feedbackAt: new Date() })
    .where(eq(generations.id, generationId));
}
