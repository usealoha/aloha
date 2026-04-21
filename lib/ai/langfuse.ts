import "server-only";
import { after } from "next/server";
import { Langfuse } from "langfuse";
import { env } from "@/lib/env";

// Single process-wide Langfuse client. The SDK batches and flushes on an
// interval, but on serverless the function freezes on response — so we
// schedule a flush via `after()` (runs after the response ships) and
// fall back to awaiting the flush directly when no request context is
// available (cron jobs, background workers).
//
// When either key is missing, `langfuse` is null and the router short-
// circuits every trace/generation call. This keeps dev without Langfuse
// credentials fully functional.

export const langfuse =
  env.LANGFUSE_PUBLIC_KEY && env.LANGFUSE_SECRET_KEY
    ? new Langfuse({
        publicKey: env.LANGFUSE_PUBLIC_KEY,
        secretKey: env.LANGFUSE_SECRET_KEY,
        baseUrl: env.LANGFUSE_BASE_URL,
      })
    : null;

async function doFlush(): Promise<void> {
  if (!langfuse) return;
  try {
    await langfuse.flushAsync();
  } catch {
    // Observability must never break the caller.
  }
}

// Defer flush until after the response is sent when called from a route
// handler / server action. Outside a request scope (QStash workers, cron)
// `after()` throws — fall back to awaiting inline so events still ship
// before the process freezes.
export async function scheduleLangfuseFlush(): Promise<void> {
  if (!langfuse) return;
  try {
    after(doFlush);
  } catch {
    await doFlush();
  }
}
