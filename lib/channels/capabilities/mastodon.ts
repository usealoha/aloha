import type { PostMedia, StudioPayload } from "@/db/schema";
import {
  publishMastodonThread,
  publishToMastodon,
} from "@/lib/publishers/mastodon";
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
import { makePostPreview } from "./previews/post-preview";
import { makeThreadPreview } from "./previews/thread-preview";
import { mediaExportFiles } from "./export-helpers";
import type { ChannelCapability } from "./types";

// Default Mastodon instance limit is 500 chars + 4 media. Some instances
// allow more, but 500 is the safe floor — stricter instances reject
// longer posts with a clear error, which the publisher surfaces.
const CW_FIELD = {
  label: "Content warning",
  placeholder: "Leave empty for no warning",
} as const;

const MastodonPostEditor = makePostEditor({
  maxChars: 500,
  label: "Post",
  contentWarning: CW_FIELD,
});
const MastodonThreadEditor = makeThreadEditor({
  maxChars: 500,
  maxMediaPerPart: 4,
  contentWarning: CW_FIELD,
});
const MastodonPostPreview = makePostPreview("mastodon");
const MastodonThreadPreview = makeThreadPreview("mastodon");

const mastodon: ChannelCapability = {
  channel: "mastodon",
  forms: [
    {
      id: "post",
      label: "Post",
      limits: { maxChars: 500, maxMedia: 4 },
      hydrate: ({ content, media }): StudioPayload => {
        const payload: PostPayload = { text: content, media };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { text, media } = readPostPayload(payload);
        return { text, media };
      },
      publish: async ({ workspaceId, payload }) => {
        const { text, media, spoilerText } = readPostPayload(payload);
        return publishToMastodon({
          workspaceId,
          text,
          media,
          spoilerText: spoilerText || undefined,
        });
      },
      exportPayload: (payload) =>
        mediaExportFiles(readPostPayload(payload).media, "mastodon-post"),
      Editor: MastodonPostEditor,
      Preview: MastodonPostPreview,
    },
    {
      id: "thread",
      label: "Thread",
      limits: { maxChars: 500, maxMedia: 4 },
      hydrate: ({ content, media }): StudioPayload => {
        const parts = splitIntoThreadParts(content);
        if (parts[0] && media.length > 0) parts[0].media = media;
        const payload: ThreadPayload = { parts };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { parts } = readThreadPayload(payload);
        return {
          text: joinThreadParts(parts),
          media: parts[0]?.media ?? [],
        };
      },
      publish: async ({ workspaceId, payload }) => {
        const { parts, spoilerText } = readThreadPayload(payload);
        const nonEmpty = parts.filter((p) => p.text.trim().length > 0);
        if (nonEmpty.length === 1) {
          return publishToMastodon({
            workspaceId,
            text: nonEmpty[0].text,
            media: nonEmpty[0].media,
            spoilerText: spoilerText || undefined,
          });
        }
        return publishMastodonThread({
          workspaceId,
          parts: nonEmpty,
          spoilerText: spoilerText || undefined,
        });
      },
      exportPayload: (payload) => {
        const { parts } = readThreadPayload(payload);
        return parts.flatMap((p, i) =>
          mediaExportFiles(p.media, `mastodon-thread-part-${i + 1}`),
        );
      },
      Editor: MastodonThreadEditor,
      Preview: MastodonThreadPreview,
    },
  ],
};

export { mastodon };
