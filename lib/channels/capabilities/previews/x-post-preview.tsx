"use client";

import { PostPreviewCard } from "@/components/post-preview-card";
import type { FormPreviewProps } from "@/lib/channels/capabilities/types";
import { readXPostPayload } from "../editors/x-post-editor";

export function XPostPreview({ payload, profile, author }: FormPreviewProps) {
  const { text, media } = readXPostPayload(payload);
  return (
    <PostPreviewCard
      channel="twitter"
      author={author}
      profile={profile}
      content={text}
      media={media}
    />
  );
}
