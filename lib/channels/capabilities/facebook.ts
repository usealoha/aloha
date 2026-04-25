import type { PostMedia, StudioPayload } from "@/db/schema";
import { readPostPayload, type PostPayload } from "./editors/post-payload";
import { readReelPayload, type ReelPayload } from "./editors/reel-payload";
import { mediaExportFiles } from "./export-helpers";
import type { ChannelCapability } from "./types";

const facebook: ChannelCapability = {
  channel: "facebook",
  forms: [
    {
      id: "post",
      label: "Post",
      limits: { maxChars: 500, maxMedia: 10 },
      hydrate: ({ content, media }): StudioPayload => {
        const payload: PostPayload = { text: content, media };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { text, media } = readPostPayload(payload);
        return { text, media };
      },
      exportPayload: (payload) =>
        mediaExportFiles(readPostPayload(payload).media, "facebook-post"),
    },
    {
      id: "longpost",
      label: "Long post",
      limits: { maxChars: 63206, maxMedia: 10 },
      hydrate: ({ content, media }): StudioPayload => {
        const payload: PostPayload = { text: content, media };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { text, media } = readPostPayload(payload);
        return { text, media };
      },
      exportPayload: (payload) =>
        mediaExportFiles(readPostPayload(payload).media, "facebook-longpost"),
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
        mediaExportFiles(readReelPayload(payload).video, "facebook-reel"),
    },
  ],
};

export { facebook };
