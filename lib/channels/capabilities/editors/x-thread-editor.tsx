"use client";

import { Plus, Trash2 } from "lucide-react";
import { MediaPicker } from "@/components/media-picker";
import type { PostMedia, StudioPayload } from "@/db/schema";
import type { FormEditorProps } from "@/lib/channels/capabilities/types";

export type XThreadPart = {
  text: string;
  media: PostMedia[];
};

export type XThreadPayload = {
  parts: XThreadPart[];
};

const MAX = 280;

export function readXThreadPayload(payload: StudioPayload): XThreadPayload {
  const raw = Array.isArray(payload.parts) ? payload.parts : null;
  if (!raw || raw.length === 0) {
    return { parts: [{ text: "", media: [] }] };
  }
  const parts: XThreadPart[] = raw.map((p) => {
    const part = p as Partial<XThreadPart>;
    return {
      text: typeof part.text === "string" ? part.text : "",
      media: Array.isArray(part.media) ? (part.media as PostMedia[]) : [],
    };
  });
  return { parts };
}

export function XThreadEditor({
  payload,
  onChange,
  disabled,
}: FormEditorProps) {
  const { parts } = readXThreadPayload(payload);

  const update = (next: XThreadPart[]) =>
    onChange({ ...payload, parts: next } satisfies XThreadPayload);

  const addPart = () =>
    update([...parts, { text: "", media: [] }]);
  const removePart = (i: number) =>
    update(parts.length === 1 ? parts : parts.filter((_, idx) => idx !== i));
  const setText = (i: number, text: string) =>
    update(parts.map((p, idx) => (idx === i ? { ...p, text } : p)));
  const setMedia = (i: number, media: PostMedia[]) =>
    update(parts.map((p, idx) => (idx === i ? { ...p, media } : p)));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Thread · {parts.length} {parts.length === 1 ? "post" : "posts"}
        </span>
      </div>
      {parts.map((part, i) => {
        const remaining = MAX - part.text.length;
        return (
          <div
            key={i}
            className="relative rounded-2xl border border-border bg-background p-3"
          >
            <div className="mb-2 flex items-center justify-between text-[11px] text-ink/55">
              <span>{i + 1} / {parts.length}</span>
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
              placeholder={i === 0 ? "What's happening?" : "Continue the thread…"}
            />
            <div className="mt-2">
              <MediaPicker
                media={part.media}
                onChange={(next) => setMedia(i, next)}
                max={4}
                disabled={disabled}
                label="Attach"
              />
            </div>
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
}
