"use client";

import { MediaPicker } from "@/components/media-picker";
import type { PostMedia, StudioPayload } from "@/db/schema";
import type { FormEditorProps } from "@/lib/channels/capabilities/types";

export type XPostPayload = {
  text: string;
  media: PostMedia[];
};

export function readXPostPayload(payload: StudioPayload): XPostPayload {
  const text = typeof payload.text === "string" ? payload.text : "";
  const media = Array.isArray(payload.media)
    ? (payload.media as PostMedia[])
    : [];
  return { text, media };
}

export function makeXPostEditor(options: { maxChars: number; label?: string }) {
  const { maxChars, label = "Post" } = options;
  return function XPostEditor({
    payload,
    onChange,
    disabled,
  }: FormEditorProps) {
    const { text, media } = readXPostPayload(payload);
    const remaining = maxChars - text.length;
    return (
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            {label}
          </span>
          <textarea
            value={text}
            onChange={(e) =>
              onChange({
                ...payload,
                text: e.target.value,
                media,
              } satisfies XPostPayload)
            }
            disabled={disabled}
            rows={maxChars > 1000 ? 14 : 6}
            className="w-full rounded-2xl border border-border bg-background p-3 text-[14.5px] leading-[1.55] text-ink focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-60"
            placeholder="What's happening?"
          />
        </label>
        <MediaPicker
          media={media}
          onChange={(next) =>
            onChange({ ...payload, text, media: next } satisfies XPostPayload)
          }
          max={4}
          disabled={disabled}
        />
        <div className="flex items-center justify-end text-[12px] text-ink/55">
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
        </div>
      </div>
    );
  };
}

export const XPostEditor = makeXPostEditor({ maxChars: 280, label: "Post" });
