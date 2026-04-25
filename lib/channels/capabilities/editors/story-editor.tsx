"use client";

import { MediaPicker } from "@/components/media-picker";
import type { PostMedia, StudioPayload } from "@/db/schema";
import type { FormEditorProps } from "@/lib/channels/capabilities/types";

export type StoryPayload = {
  media: PostMedia[];
};

export function readStoryPayload(payload: StudioPayload): StoryPayload {
  const media = Array.isArray(payload.media)
    ? (payload.media as PostMedia[])
    : [];
  return { media };
}

export function StoryEditor({ payload, onChange, disabled }: FormEditorProps) {
  const { media } = readStoryPayload(payload);
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
        Story media
      </span>
      <p className="text-[12px] text-ink/55">
        Stories support a single image or video. Captions aren&apos;t published
        through the API — add text to the media itself before uploading if you
        want it to appear.
      </p>
      <MediaPicker
        media={media}
        onChange={(next) =>
          onChange({ ...payload, media: next.slice(0, 1) } satisfies StoryPayload)
        }
        max={1}
        accept="image/*,video/*"
        disabled={disabled}
        label="Upload"
      />
    </div>
  );
}
