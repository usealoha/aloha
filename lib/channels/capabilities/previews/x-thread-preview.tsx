"use client";

import { PostPreviewCard } from "@/components/post-preview-card";
import type { FormPreviewProps } from "@/lib/channels/capabilities/types";
import { readXThreadPayload } from "../editors/x-thread-editor";

export function XThreadPreview({ payload, profile, author }: FormPreviewProps) {
  const { parts } = readXThreadPayload(payload);
  return (
    <div className="flex flex-col gap-3">
      {parts.map((part, i) => (
        <div key={i} className="relative">
          {i > 0 ? (
            <span
              aria-hidden
              className="absolute left-9 -top-3 h-3 w-px bg-border"
            />
          ) : null}
          <PostPreviewCard
            channel="twitter"
            author={author}
            profile={profile}
            content={part.text}
            media={part.media}
            timestampLabel={i === 0 ? "just now" : `${i + 1}/${parts.length}`}
          />
        </div>
      ))}
    </div>
  );
}
