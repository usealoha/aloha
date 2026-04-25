import type { PostMedia, StudioPayload } from "@/db/schema";
import {
  readShortPayload,
  type ShortPayload,
} from "./editors/short-payload";
import { mediaExportFiles } from "./export-helpers";
import type { ChannelCapability } from "./types";

const youtube: ChannelCapability = {
  channel: "youtube",
  forms: [
    {
      id: "short",
      label: "Short",
      limits: { maxChars: 5000, maxMedia: 1, requiresMedia: true },
      hydrate: ({ content, media }): StudioPayload => {
        const lines = content.split("\n");
        const first = lines[0]?.trim() ?? "";
        const hasTitle = first.length > 0 && first.length <= 100;
        const title = hasTitle ? first : "";
        const description = hasTitle ? lines.slice(1).join("\n").trim() : content;
        const payload: ShortPayload = {
          title,
          description,
          video: media.filter((m) => m.mimeType.startsWith("video/")),
        };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { title, description, video } = readShortPayload(payload);
        const text = [title, description].filter(Boolean).join("\n\n");
        return { text, media: video };
      },
      exportPayload: (payload) => {
        const { title, video } = readShortPayload(payload);
        return mediaExportFiles(video, title ? `youtube-${title}` : "youtube-short");
      },
    },
  ],
};

export { youtube };
