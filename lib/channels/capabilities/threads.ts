import type { PostMedia, StudioPayload } from "@/db/schema";
import {
  publishThreadsThread,
  publishToThreads,
} from "@/lib/publishers/threads";
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

// Threads currently supports one image per post via the Graph API, so
// thread parts are capped at a single piece of media each. The overall
// post character limit is 500.
const ThreadsPostEditor = makePostEditor({ maxChars: 500, label: "Post" });
const ThreadsThreadEditor = makeThreadEditor({
  maxChars: 500,
  maxMediaPerPart: 1,
});
const ThreadsPostPreview = makePostPreview("threads");
const ThreadsThreadPreview = makeThreadPreview("threads");

const threads: ChannelCapability = {
  channel: "threads",
  forms: [
    {
      id: "post",
      label: "Post",
      limits: { maxChars: 500, maxMedia: 1 },
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
        return publishToThreads({ workspaceId, text, media });
      },
      exportPayload: (payload) =>
        mediaExportFiles(readPostPayload(payload).media, "threads-post"),
      Editor: ThreadsPostEditor,
      Preview: ThreadsPostPreview,
    },
    {
      id: "thread",
      label: "Thread",
      limits: { maxChars: 500, maxMedia: 1 },
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
        const { parts } = readThreadPayload(payload);
        const nonEmpty = parts.filter((p) => p.text.trim().length > 0);
        if (nonEmpty.length === 1) {
          return publishToThreads({
            workspaceId,
            text: nonEmpty[0].text,
            media: nonEmpty[0].media,
          });
        }
        return publishThreadsThread({ workspaceId, parts: nonEmpty });
      },
      exportPayload: (payload) => {
        const { parts } = readThreadPayload(payload);
        return parts.flatMap((p, i) =>
          mediaExportFiles(p.media, `threads-thread-part-${i + 1}`),
        );
      },
      Editor: ThreadsThreadEditor,
      Preview: ThreadsThreadPreview,
    },
  ],
};

export { threads };
