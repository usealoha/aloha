// Thin OpenRouter client. OpenRouter exposes an OpenAI-compatible chat
// completions endpoint, so we fetch directly and skip the SDK dependency.

import { env } from "@/lib/env";

type Message = { role: "system" | "user" | "assistant"; content: string };

export type OpenRouterChatInput = {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
};

export type OpenRouterChatResult = {
  text: string;
  tokensIn: number;
  tokensOut: number;
  raw: unknown;
};

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export async function openRouterChat(
  input: OpenRouterChatInput,
): Promise<OpenRouterChatResult> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": env.APP_URL,
      "X-Title": "Aloha",
    },
    body: JSON.stringify({
      model: input.model,
      messages: input.messages,
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxTokens,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new OpenRouterError(
      `OpenRouter ${res.status}: ${body.slice(0, 500)}`,
      res.status,
    );
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const text = json.choices?.[0]?.message?.content ?? "";
  const tokensIn = json.usage?.prompt_tokens ?? 0;
  const tokensOut = json.usage?.completion_tokens ?? 0;

  return { text, tokensIn, tokensOut, raw: json };
}

export class OpenRouterError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "OpenRouterError";
    this.status = status;
  }
}
