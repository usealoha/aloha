"use client";

import { PostPreviewCard } from "@/components/post-preview-card";
import type { FormPreviewProps } from "@/lib/channels/capabilities/types";
import { readXPollPayload } from "../editors/x-poll-editor";

export function XPollPreview({ payload, profile, author }: FormPreviewProps) {
  const { text, options, durationMinutes } = readXPollPayload(payload);
  const durationLabel = formatDuration(durationMinutes);
  const composed = [
    text,
    "",
    ...options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o || "—"}`),
    "",
    `Poll · ${durationLabel} left`,
  ].join("\n");
  return (
    <PostPreviewCard
      channel="twitter"
      author={author}
      profile={profile}
      content={composed}
    />
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
