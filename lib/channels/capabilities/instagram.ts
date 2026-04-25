import type { PostMedia, StudioPayload } from "@/db/schema";
import { readPostPayload, type PostPayload } from "./editors/post-payload";
import { readReelPayload, type ReelPayload } from "./editors/reel-payload";
import { readStoryPayload, type StoryPayload } from "./editors/story-payload";
import { mediaExportFiles } from "./export-helpers";
import type { ChannelCapability } from "./types";

const instagram: ChannelCapability = {
  channel: "instagram",
  forms: [
    {
      id: "feed",
      label: "Feed",
      limits: { maxChars: 2200, maxMedia: 10, requiresMedia: true },
      hydrate: ({ content, media }): StudioPayload => {
        const payload: PostPayload = { text: content, media };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { text, media } = readPostPayload(payload);
        return { text, media };
      },
      exportPayload: (payload) =>
        mediaExportFiles(readPostPayload(payload).media, "instagram-feed"),
    },
    {
      id: "reel",
      label: "Reel",
      limits: { maxChars: 2200, maxMedia: 1, requiresMedia: true },
      hydrate: ({ content, media }): StudioPayload => {
        const video = media.filter((m) => m.mimeType.startsWith("video/"));
        const payload: ReelPayload = {
          caption: content,
          video,
          shareToFeed: true,
        };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { caption, video } = readReelPayload(payload);
        return { text: caption, media: video };
      },
      exportPayload: (payload) =>
        mediaExportFiles(readReelPayload(payload).video, "instagram-reel"),
    },
    {
      id: "story",
      label: "Story",
      limits: { maxMedia: 1, requiresMedia: true },
      hydrate: ({ media }): StudioPayload => {
        const payload: StoryPayload = { media: media.slice(0, 1) };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { media } = readStoryPayload(payload);
        return { text: "", media };
      },
      exportPayload: (payload) =>
        mediaExportFiles(readStoryPayload(payload).media, "instagram-story"),
    },
  ],
};

export { instagram };
