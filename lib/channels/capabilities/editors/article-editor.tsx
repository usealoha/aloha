"use client";

import { MediaPicker } from "@/components/media-picker";
import type { PostMedia, StudioPayload } from "@/db/schema";
import type { FormEditorProps } from "@/lib/channels/capabilities/types";

// Article editor. Shared across long-form channels (Medium, and later
// LinkedIn Article / Ghost / Hashnode). Title and body are separate
// first-class fields; body is markdown.
export type ArticlePayload = {
  title: string;
  body: string;
  media: PostMedia[];
};

export function readArticlePayload(payload: StudioPayload): ArticlePayload {
  const title = typeof payload.title === "string" ? payload.title : "";
  const body = typeof payload.body === "string" ? payload.body : "";
  const media = Array.isArray(payload.media)
    ? (payload.media as PostMedia[])
    : [];
  return { title, body, media };
}

export function makeArticleEditor(options: {
  titlePlaceholder?: string;
  bodyPlaceholder?: string;
  titleMax?: number;
  maxMedia?: number;
}) {
  const {
    titlePlaceholder = "Title",
    bodyPlaceholder = "Write your article…",
    titleMax = 100,
    maxMedia = 4,
  } = options;
  return function ArticleEditor({
    payload,
    onChange,
    disabled,
  }: FormEditorProps) {
    const { title, body, media } = readArticlePayload(payload);
    const titleRemaining = titleMax - title.length;
    const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
    const update = (next: Partial<ArticlePayload>) =>
      onChange({
        ...payload,
        title: next.title ?? title,
        body: next.body ?? body,
        media: next.media ?? media,
      } satisfies ArticlePayload);
    return (
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Title
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => update({ title: e.target.value })}
            disabled={disabled}
            maxLength={titleMax}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[18px] font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-60"
            placeholder={titlePlaceholder}
          />
          <span
            className={
              titleRemaining < 10
                ? "self-end text-[11px] text-amber-600"
                : "self-end text-[11px] text-ink/55"
            }
          >
            {titleRemaining}
          </span>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Body (Markdown)
          </span>
          <textarea
            value={body}
            onChange={(e) => update({ body: e.target.value })}
            disabled={disabled}
            rows={22}
            className="w-full rounded-2xl border border-border bg-background p-3 text-[14.5px] leading-[1.6] text-ink font-mono focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-60"
            placeholder={bodyPlaceholder}
          />
          <span className="self-end text-[11px] text-ink/55">
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
        </label>
        {maxMedia > 0 ? (
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
              Media
            </span>
            <MediaPicker
              media={media}
              onChange={(next) => update({ media: next })}
              max={maxMedia}
              disabled={disabled}
              label="Attach image"
            />
          </div>
        ) : null}
      </div>
    );
  };
}
