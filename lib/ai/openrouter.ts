// Thin OpenRouter client. OpenRouter exposes an OpenAI-compatible chat
// completions endpoint, so we fetch directly and skip the SDK dependency.

import { env } from "@/lib/env";

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type Message = {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
};

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

export type OpenRouterStreamEvent =
  | { type: "chunk"; text: string }
  | { type: "done"; tokensIn: number; tokensOut: number };

// Streaming variant. Parses SSE from OpenRouter's chat completions endpoint
// and yields text deltas as they arrive, plus a final "done" event with
// usage totals. Consumers drive it with `for await`.
export async function* openRouterChatStream(
  input: OpenRouterChatInput,
): AsyncGenerator<OpenRouterStreamEvent> {
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
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    throw new OpenRouterError(
      `OpenRouter ${res.status}: ${body.slice(0, 500)}`,
      res.status,
    );
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let tokensIn = 0;
  let tokensOut = 0;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by blank lines.
      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const raw = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const line = raw.split("\n").find((l) => l.startsWith("data:"));
        if (!line) continue;
        const payload = line.slice("data:".length).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>;
            usage?: { prompt_tokens?: number; completion_tokens?: number };
          };
          const delta = ev.choices?.[0]?.delta?.content;
          if (delta) yield { type: "chunk", text: delta };
          if (ev.usage) {
            tokensIn = ev.usage.prompt_tokens ?? tokensIn;
            tokensOut = ev.usage.completion_tokens ?? tokensOut;
          }
        } catch {
          // tolerate partial/non-JSON keepalives
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  yield { type: "done", tokensIn, tokensOut };
}

export class OpenRouterError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "OpenRouterError";
    this.status = status;
  }
}
