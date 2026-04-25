"use client";

import { PostPreviewCard } from "@/components/post-preview-card";
import type { FormPreviewProps } from "@/lib/channels/capabilities/types";
import { readPostPayload } from "../editors/post-editor";

export function makePostPreview(channel: string) {
  return function PostPreview({ payload, profile, author }: FormPreviewProps) {
    const { text, media } = readPostPayload(payload);
    return (
      <PostPreviewCard
        channel={channel}
        author={author}
        profile={profile}
        content={text}
        media={media}
      />
    );
  };
}
