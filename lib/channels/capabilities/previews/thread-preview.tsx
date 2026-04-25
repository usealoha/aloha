"use client";

import { PostPreviewCard } from "@/components/post-preview-card";
import type { FormPreviewProps } from "@/lib/channels/capabilities/types";
import { readThreadPayload } from "../editors/thread-editor";

export function makeThreadPreview(channel: string) {
  return function ThreadPreview({
    payload,
    profile,
    author,
  }: FormPreviewProps) {
    const { parts } = readThreadPayload(payload);
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
              channel={channel}
              author={author}
              profile={profile}
              content={part.text}
              media={part.media}
              timestampLabel={
                i === 0 ? "just now" : `${i + 1}/${parts.length}`
              }
            />
          </div>
        ))}
      </div>
    );
  };
}
