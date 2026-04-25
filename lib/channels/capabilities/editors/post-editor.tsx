"use client";

import { MediaPicker } from "@/components/media-picker";
import type { FormEditorProps } from "@/lib/channels/capabilities/types";
import { readPostPayload, type PostPayload } from "./post-payload";

export { readPostPayload, type PostPayload } from "./post-payload";

export function makePostEditor(options: {
  maxChars: number;
  label?: string;
  placeholder?: string;
  maxMedia?: number;
  acceptMedia?: string;
  // Enables a content-warning / spoiler text row above the body. When
  // enabled the field is always rendered; empty string = no warning.
  contentWarning?: { label: string; placeholder?: string };
}) {
  const {
    maxChars,
    label = "Post",
    placeholder = "What's happening?",
    maxMedia = 4,
    acceptMedia,
    contentWarning,
  } = options;
  return function PostEditor({
    payload,
    onChange,
    disabled,
  }: FormEditorProps) {
    const { text, media, spoilerText } = readPostPayload(payload);
    return (
      <div className="flex flex-col h-full">
        {contentWarning ? (
          <input
            type="text"
            value={spoilerText ?? ""}
            onChange={(e) =>
              onChange({
                ...payload,
                text,
                media,
                spoilerText: e.target.value,
              } satisfies PostPayload)
            }
            disabled={disabled}
            className="w-full bg-transparent border-0 border-b border-border px-0 py-2 text-[13px] text-ink/80 focus:outline-none focus:border-ink placeholder:text-ink/35 disabled:opacity-60 mb-3"
            placeholder={contentWarning.placeholder ?? contentWarning.label}
          />
        ) : null}
        <textarea
          value={text}
          onChange={(e) =>
            onChange({
              ...payload,
              text: e.target.value,
              media,
            } satisfies PostPayload)
          }
          disabled={disabled}
          rows={maxChars > 1000 ? 18 : 10}
          className="flex-1 w-full bg-transparent border-0 px-0 py-0 text-[15.5px] leading-[1.6] text-ink resize-none focus:outline-none focus:ring-0 placeholder:text-ink/35 disabled:opacity-60"
          placeholder={placeholder}
          aria-label={label}
        />
        {/*
          Attach + character/word count live in the Studio shell footer
          now (StudioEditorFooter) so the editor stays a clean canvas and
          the footers match compose visually.

          Attached media thumbnails still need to render somewhere — the
          shell-level footer only houses controls, not previews. Render
          them inline above the canvas footer when present.
        */}
        {maxMedia > 0 && media.length > 0 ? (
          <div className="pt-3 border-t border-border/60">
            <MediaPicker
              media={media}
              onChange={(next) =>
                onChange({
                  ...payload,
                  text,
                  media: next,
                } satisfies PostPayload)
              }
              max={maxMedia}
              accept={acceptMedia}
              disabled={disabled}
            />
          </div>
        ) : null}
      </div>
    );
  };
}
