"use client";

import { Film } from "lucide-react";
import type { FormPreviewProps } from "@/lib/channels/capabilities/types";
import { readReelPayload } from "../editors/reel-editor";

export function ReelPreview({ payload, profile, author }: FormPreviewProps) {
  const { caption, video } = readReelPayload(payload);
  const clip = video[0];
  const displayName = profile?.displayName ?? author.name;
  const handle = profile?.handle ?? "@handle";
  return (
    <article className="w-full max-w-[300px] rounded-[28px] border border-border bg-ink/95 text-background overflow-hidden shadow-[0_14px_32px_-18px_rgba(26,22,18,0.35)]">
      <div className="relative aspect-[9/16] bg-ink">
        {clip ? (
          <video
            src={clip.url}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-background/40">
            <div className="text-center">
              <Film className="w-8 h-8 mx-auto" />
              <p className="mt-2 text-[12px]">Upload a video</p>
            </div>
          </div>
        )}
        <div className="absolute left-3 right-3 bottom-3 space-y-1">
          <p className="text-[13px] font-semibold">{displayName}</p>
          <p className="text-[12px] opacity-80 line-clamp-2">
            {caption || "Your caption will appear here"}
          </p>
          <p className="text-[11px] opacity-60">{handle}</p>
        </div>
      </div>
    </article>
  );
}
