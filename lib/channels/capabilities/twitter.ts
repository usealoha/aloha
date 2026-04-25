import type { PostMedia, StudioPayload } from "@/db/schema";
import { publishToX, publishXPoll, publishXThread } from "@/lib/publishers/x";
import {
  makePostEditor,
  readPostPayload,
  type PostPayload,
} from "./editors/post-editor";
import {
  joinThreadParts,
  makeThreadEditor,
  readThreadPayload,
  splitIntoThreadParts,
  type ThreadPayload,
} from "./editors/thread-editor";
import {
  readXPollPayload,
  XPollEditor,
  type XPollPayload,
} from "./editors/x-poll-editor";
import { XPollPreview } from "./previews/x-poll-preview";
import { makePostPreview } from "./previews/post-preview";
import { makeThreadPreview } from "./previews/thread-preview";
import { mediaExportFiles } from "./export-helpers";
import type { ChannelCapability } from "./types";

const XPostPreview = makePostPreview("twitter");
const XThreadPreview = makeThreadPreview("twitter");
const XPostEditor = makePostEditor({ maxChars: 280, label: "Post" });
const XLongEditor = makePostEditor({ maxChars: 25000, label: "Long post" });
const XThreadEditor = makeThreadEditor({ maxChars: 280, maxMediaPerPart: 4 });

const twitter: ChannelCapability = {
  channel: "twitter",
  forms: [
    {
      id: "post",
      label: "Post",
      limits: { maxChars: 280, maxMedia: 4 },
      hydrate: ({ content, media }): StudioPayload => {
        const payload: PostPayload = { text: content, media };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { text, media } = readPostPayload(payload);
        return { text, media };
      },
      publish: async ({ workspaceId, payload }) => {
        const { text, media } = readPostPayload(payload);
        return publishToX({ workspaceId, text, media });
      },
      exportPayload: (payload) =>
        mediaExportFiles(readPostPayload(payload).media, "x-post"),
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
        const payload: PostPayload = { text: content, media };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { text, media } = readPostPayload(payload);
        return { text, media };
      },
      publish: async ({ workspaceId, payload }) => {
        const { text, media } = readPostPayload(payload);
        return publishToX({ workspaceId, text, media });
      },
      exportPayload: (payload) =>
        mediaExportFiles(readPostPayload(payload).media, "x-longpost"),
      Editor: XLongEditor,
      Preview: XPostPreview,
    },
    {
      id: "thread",
      label: "Thread",
      limits: { maxChars: 280, maxMedia: 4 },
      hydrate: ({ content, media }): StudioPayload => {
        const parts = splitIntoThreadParts(content);
        // Attach existing media to the first part so we don't silently drop
        // it when the user enters thread mode from a post with an image.
        if (parts[0] && media.length > 0) parts[0].media = media;
        const payload: ThreadPayload = { parts };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { parts } = readThreadPayload(payload);
        // When flattening back to Compose, only the first part's media
        // survives — the flat model is one content + one media list.
        return {
          text: joinThreadParts(parts),
          media: parts[0]?.media ?? [],
        };
      },
      publish: async ({ workspaceId, payload }) => {
        const { parts } = readThreadPayload(payload);
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
      exportPayload: (payload) => {
        const { parts } = readThreadPayload(payload);
        return parts.flatMap((p, i) =>
          mediaExportFiles(p.media, `x-thread-part-${i + 1}`),
        );
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
