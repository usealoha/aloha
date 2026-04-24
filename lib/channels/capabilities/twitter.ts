import type { PostMedia, StudioPayload } from "@/db/schema";
import { publishToX, publishXPoll, publishXThread } from "@/lib/publishers/x";
import {
  makeXPostEditor,
  readXPostPayload,
  XPostEditor,
  type XPostPayload,
} from "./editors/x-post-editor";
import {
  readXThreadPayload,
  XThreadEditor,
  type XThreadPart,
  type XThreadPayload,
} from "./editors/x-thread-editor";
import {
  readXPollPayload,
  XPollEditor,
  type XPollPayload,
} from "./editors/x-poll-editor";
import { XPollPreview } from "./previews/x-poll-preview";
import { XPostPreview } from "./previews/x-post-preview";
import { XThreadPreview } from "./previews/x-thread-preview";
import type { ChannelCapability } from "./types";

// Split body on blank lines into thread parts. A blank line is a more
// explicit "new post" signal than a single newline — tweets routinely
// span multiple lines (lists, quotes), so splitting on \n\n keeps those
// intact while still recognising an author's structural break.
function splitIntoParts(content: string): XThreadPart[] {
  const chunks = content
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (chunks.length === 0) {
    return [{ text: "", media: [] }];
  }
  return chunks.map((text) => ({ text, media: [] }));
}

const twitter: ChannelCapability = {
  channel: "twitter",
  forms: [
    {
      id: "post",
      label: "Post",
      limits: { maxChars: 280, maxMedia: 4 },
      hydrate: ({ content, media }): StudioPayload => {
        const payload: XPostPayload = { text: content, media };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { text, media } = readXPostPayload(payload);
        return { text, media };
      },
      publish: async ({ workspaceId, payload }) => {
        const { text, media } = readXPostPayload(payload);
        return publishToX({ workspaceId, text, media });
      },
      Editor: XPostEditor,
      Preview: XPostPreview,
    },
    {
      id: "longpost",
      label: "Long post",
      // X accepts up to 25k chars when the authoring account has Premium.
      // Without Premium, the API rejects with 400 and the error bubbles
      // up as invalid_content — surfaced to the user as a publish failure.
      limits: { maxChars: 25000, maxMedia: 4 },
      hydrate: ({ content, media }): StudioPayload => {
        const payload: XPostPayload = { text: content, media };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { text, media } = readXPostPayload(payload);
        return { text, media };
      },
      publish: async ({ workspaceId, payload }) => {
        const { text, media } = readXPostPayload(payload);
        return publishToX({ workspaceId, text, media });
      },
      Editor: makeXPostEditor({ maxChars: 25000, label: "Long post" }),
      Preview: XPostPreview,
    },
    {
      id: "thread",
      label: "Thread",
      limits: { maxChars: 280, maxMedia: 4 },
      hydrate: ({ content, media }): StudioPayload => {
        const parts = splitIntoParts(content);
        // Attach existing media to the first part so we don't silently drop
        // it when the user enters thread mode from a post with an image.
        if (parts[0] && media.length > 0) parts[0].media = media;
        const payload: XThreadPayload = { parts };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { parts } = readXThreadPayload(payload);
        const text = parts
          .map((p) => p.text.trim())
          .filter(Boolean)
          .join("\n\n");
        // When flattening back to Compose, only the first part's media
        // survives — the flat model is one content + one media list.
        const media = parts[0]?.media ?? [];
        return { text, media };
      },
      publish: async ({ workspaceId, payload }) => {
        const { parts } = readXThreadPayload(payload);
        const nonEmpty = parts.filter((p) => p.text.trim().length > 0);
        if (nonEmpty.length === 1) {
          // Degenerate thread = just a post; avoid unnecessary reply chain.
          return publishToX({
            workspaceId,
            text: nonEmpty[0].text,
            media: nonEmpty[0].media,
          });
        }
        return publishXThread({ workspaceId, parts: nonEmpty });
      },
      Editor: XThreadEditor,
      Preview: XThreadPreview,
    },
    {
      id: "poll",
      label: "Poll",
      limits: { maxChars: 280 },
      hydrate: ({ content }): StudioPayload => {
        const payload: XPollPayload = {
          text: content,
          options: ["", ""],
          durationMinutes: 1440,
        };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { text } = readXPollPayload(payload);
        return { text, media: [] };
      },
      publish: async ({ workspaceId, payload }) => {
        const { text, options, durationMinutes } = readXPollPayload(payload);
        const cleaned = options.map((o) => o.trim()).filter(Boolean);
        if (cleaned.length < 2) {
          throw new Error("Poll needs at least two options.");
        }
        return publishXPoll({
          workspaceId,
          text,
          options: cleaned,
          durationMinutes,
        });
      },
      Editor: XPollEditor,
      Preview: XPollPreview,
    },
  ],
};

export { twitter };
