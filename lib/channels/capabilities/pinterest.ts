import type { PostMedia, StudioPayload } from "@/db/schema";
import { readPinPayload, type PinPayload } from "./editors/pin-payload";
import { mediaExportFiles } from "./export-helpers";
import type { ChannelCapability } from "./types";

const pinterest: ChannelCapability = {
  channel: "pinterest",
  forms: [
    {
      id: "pin",
      label: "Pin",
      limits: { maxChars: 500, maxMedia: 1 },
      hydrate: ({ content, media }): StudioPayload => {
        const payload: PinPayload = {
          title: content.split("\n")[0]?.slice(0, 100) ?? "",
          description: content,
          link: "",
          media,
        };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { title, description, media } = readPinPayload(payload);
        const text = [title, description].filter(Boolean).join("\n\n");
        return { text, media };
      },
      exportPayload: (payload) => {
        const { title, media } = readPinPayload(payload);
        return mediaExportFiles(media, title ? `pin-${title}` : "pin");
      },
    },
  ],
};

export { pinterest };
