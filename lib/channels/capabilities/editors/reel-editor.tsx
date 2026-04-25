"use client";

import { MediaPicker } from "@/components/media-picker";
import type { FormEditorProps } from "@/lib/channels/capabilities/types";
import { readReelPayload, type ReelPayload } from "./reel-payload";

export { readReelPayload, type ReelPayload } from "./reel-payload";

const CAPTION_MAX = 2200;

export function ReelEditor({ payload, onChange, disabled }: FormEditorProps) {
  const { caption, video, shareToFeed } = readReelPayload(payload);
  const update = (next: Partial<ReelPayload>) =>
    onChange({
      ...payload,
      caption: next.caption ?? caption,
      video: next.video ?? video,
      shareToFeed:
        typeof next.shareToFeed === "boolean" ? next.shareToFeed : shareToFeed,
    } satisfies ReelPayload);
  const remaining = CAPTION_MAX - caption.length;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Video
        </span>
        <MediaPicker
          media={video}
          onChange={(next) =>
            update({ video: next.filter((m) => m.mimeType.startsWith("video/")) })
          }
          max={1}
          accept="video/*"
          disabled={disabled}
          label="Upload video"
        />
      </div>
      <label className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Caption
        </span>
        <textarea
          value={caption}
          onChange={(e) => update({ caption: e.target.value })}
          disabled={disabled}
          rows={6}
          className="w-full rounded-2xl border border-border bg-background p-3 text-[14.5px] leading-[1.55] text-ink focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-60"
          placeholder="Write a caption…"
        />
        <span
          className={
            remaining < 0
              ? "self-end text-[12px] text-red-600"
              : remaining < 50
                ? "self-end text-[12px] text-amber-600"
                : "self-end text-[12px] text-ink/55"
          }
        >
          {remaining}
        </span>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={shareToFeed}
          onChange={(e) => update({ shareToFeed: e.target.checked })}
          disabled={disabled}
          className="rounded border-border disabled:opacity-60"
        />
        <span className="text-[13px] text-ink">Also share to Feed</span>
      </label>
    </div>
  );
}
