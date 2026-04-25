"use client";

import { ImagePlus } from "lucide-react";
import type { FormPreviewProps } from "@/lib/channels/capabilities/types";
import { readStoryPayload } from "../editors/story-editor";

export function StoryPreview({ payload, profile, author }: FormPreviewProps) {
  const { media } = readStoryPayload(payload);
  const item = media[0];
  const displayName = profile?.displayName ?? author.name;
  const avatar = profile?.avatarUrl ?? author.image;
  return (
    <article className="w-full max-w-[280px] rounded-[28px] border border-border bg-ink/95 text-background overflow-hidden shadow-[0_14px_32px_-18px_rgba(26,22,18,0.35)]">
      <div className="relative aspect-[9/16] bg-ink">
        {item ? (
          item.mimeType.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.url}
              alt={item.alt ?? ""}
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              src={item.url}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          )
        ) : (
          <div className="w-full h-full grid place-items-center text-background/40">
            <div className="text-center">
              <ImagePlus className="w-8 h-8 mx-auto" />
              <p className="mt-2 text-[12px]">Upload story media</p>
            </div>
          </div>
        )}
        <div className="absolute top-3 left-3 right-3 flex items-center gap-2">
          <span className="w-7 h-7 rounded-full overflow-hidden border-2 border-background bg-peach-100">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : null}
          </span>
          <p className="text-[12px] font-semibold">{displayName}</p>
        </div>
      </div>
    </article>
  );
}
