// SSE consumer for /api/ai/import. The endpoint streams per-platform
// chunks via `data: {json}\n\n` lines (see app/api/ai/import/route.ts).
// We mirror its event shape here, parse incrementally, and yield
// strongly-typed events to the caller so the popup can render
// streaming previews without re-implementing the parser.
//
// The web app's import-panel.tsx has a near-identical parser; we don't
// share it because the extension bundle ships independently and we'd
// rather not pull web app code in via path alias for non-types.

export type ImportEvent =
  | {
      type: "extracted";
      url: string;
      title: string;
      excerpt: string;
      ogImage: string | null;
      content: string;
    }
  | { platform: string; type: "start" }
  | { platform: string; type: "chunk"; text: string }
  | { platform: string; type: "done"; text: string }
  | { platform: string; type: "error"; message: string }
  | { type: "all_done" }
  | { type: "fatal"; message: string };

export async function* readImportStream(
  res: Response,
): AsyncGenerator<ImportEvent, void, void> {
  if (!res.body) {
    throw new Error("Response has no body");
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Events are delimited by blank lines. Walk the buffer and emit
      // each completed event, leaving any trailing partial chunk in
      // place for the next read.
      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const raw = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const line = raw.split("\n").find((l) => l.startsWith("data:"));
        if (!line) continue;
        const payload = line.slice("data:".length).trim();
        if (!payload) continue;
        try {
          yield JSON.parse(payload) as ImportEvent;
        } catch {
          // Skip malformed events — a single bad frame shouldn't kill
          // the whole fanout. Server-side errors come through as
          // `error` / `fatal` events anyway.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
