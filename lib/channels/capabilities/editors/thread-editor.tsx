"use client";

import { Plus, Trash2 } from "lucide-react";
import { MediaPicker } from "@/components/media-picker";
import type { PostMedia, StudioPayload } from "@/db/schema";
import type { FormEditorProps } from "@/lib/channels/capabilities/types";

// Generic thread editor. Channels that support chained replies (X,
// Bluesky, Threads, Mastodon) share this shell and only differ by char
// limit + media cap.
export type ThreadPart = {
  text: string;
  media: PostMedia[];
};

export type ThreadPayload = {
  parts: ThreadPart[];
  // Thread-level content warning. Applied to every part by publishers
  // that support CW (Mastodon). Empty / undefined = no warning.
  spoilerText?: string;
};

export function readThreadPayload(payload: StudioPayload): ThreadPayload {
  const raw = Array.isArray(payload.parts) ? payload.parts : null;
  const spoilerText =
    typeof payload.spoilerText === "string" ? payload.spoilerText : undefined;
  if (!raw || raw.length === 0) {
    return { parts: [{ text: "", media: [] }], spoilerText };
  }
  const parts: ThreadPart[] = raw.map((p) => {
    const part = p as Partial<ThreadPart>;
    return {
      text: typeof part.text === "string" ? part.text : "",
      media: Array.isArray(part.media) ? (part.media as PostMedia[]) : [],
    };
  });
  return { parts, spoilerText };
}

export function makeThreadEditor(options: {
  maxChars: number;
  maxMediaPerPart?: number;
  firstPlaceholder?: string;
  continuePlaceholder?: string;
  acceptMedia?: string;
  // Enables a single thread-level content-warning row. Publishers apply
  // the CW to every part in the thread (Mastodon convention).
  contentWarning?: { label: string; placeholder?: string };
}) {
  const {
    maxChars,
    maxMediaPerPart = 4,
    firstPlaceholder = "What's happening?",
    continuePlaceholder = "Continue the thread…",
    acceptMedia,
    contentWarning,
  } = options;
  return function ThreadEditor({
    payload,
    onChange,
    disabled,
  }: FormEditorProps) {
    const { parts, spoilerText } = readThreadPayload(payload);

    const update = (next: Partial<ThreadPayload>) =>
      onChange({
        ...payload,
        parts: next.parts ?? parts,
        spoilerText: "spoilerText" in next ? next.spoilerText : spoilerText,
      } satisfies ThreadPayload);

    const setParts = (next: ThreadPart[]) => update({ parts: next });
    const setSpoiler = (v: string) => update({ spoilerText: v });
    const addPart = () => setParts([...parts, { text: "", media: [] }]);
    const removePart = (i: number) =>
      setParts(
        parts.length === 1 ? parts : parts.filter((_, idx) => idx !== i),
      );
    const setText = (i: number, text: string) =>
      setParts(parts.map((p, idx) => (idx === i ? { ...p, text } : p)));
    const setMedia = (i: number, media: PostMedia[]) =>
      setParts(parts.map((p, idx) => (idx === i ? { ...p, media } : p)));

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Thread · {parts.length} {parts.length === 1 ? "post" : "posts"}
          </span>
        </div>
        {contentWarning ? (
          <label className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
              {contentWarning.label}
            </span>
            <input
              type="text"
              value={spoilerText ?? ""}
              onChange={(e) => setSpoiler(e.target.value)}
              disabled={disabled}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-60"
              placeholder={contentWarning.placeholder ?? "Optional"}
            />
          </label>
        ) : null}
        {parts.map((part, i) => {
          const remaining = maxChars - part.text.length;
          return (
            <div
              key={i}
              className="relative rounded-2xl border border-border bg-background p-3"
            >
              <div className="mb-2 flex items-center justify-between text-[11px] text-ink/55">
                <span>
                  {i + 1} / {parts.length}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      remaining < 0
                        ? "text-red-600"
                        : remaining < 20
                          ? "text-amber-600"
                          : undefined
                    }
                  >
                    {remaining}
                  </span>
                  {parts.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removePart(i)}
                      disabled={disabled}
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-ink/50 hover:bg-muted/60 hover:text-ink transition-colors disabled:opacity-50"
                      aria-label="Remove post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>
              <textarea
                value={part.text}
                onChange={(e) => setText(i, e.target.value)}
                disabled={disabled}
                rows={4}
                className="w-full rounded-xl border border-border bg-background-elev p-2.5 text-[14.5px] leading-[1.5] text-ink focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-60"
                placeholder={i === 0 ? firstPlaceholder : continuePlaceholder}
              />
              {maxMediaPerPart > 0 ? (
                <div className="mt-2">
                  <MediaPicker
                    media={part.media}
                    onChange={(next) => setMedia(i, next)}
                    max={maxMediaPerPart}
                    accept={acceptMedia}
                    disabled={disabled}
                    label="Attach"
                  />
                </div>
              ) : null}
            </div>
          );
        })}
        <button
          type="button"
          onClick={addPart}
          disabled={disabled}
          className="self-start inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-ink hover:bg-muted/60 transition-colors disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          Add post
        </button>
      </div>
    );
  };
}

// Helper: split a flat content body into thread parts on blank lines. A
// blank line is a more explicit "new post" signal than a single newline
// since single line-breaks are common within lists and quotes.
export function splitIntoThreadParts(content: string): ThreadPart[] {
  const chunks = content
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (chunks.length === 0) return [{ text: "", media: [] }];
  return chunks.map((text) => ({ text, media: [] }));
}

// Helper: join structured thread parts back into a flat body for
// exit-to-Compose.
export function joinThreadParts(parts: ThreadPart[]): string {
  return parts
    .map((p) => p.text.trim())
    .filter(Boolean)
    .join("\n\n");
}
