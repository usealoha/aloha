import type { PostMedia, StudioPayload } from "@/db/schema";
import {
  publishRedditImage,
  publishRedditLink,
  publishRedditText,
  publishRedditVideo,
} from "@/lib/publishers/reddit";
import {
  readRedditLinkPayload,
  readRedditMediaPayload,
  readRedditTextPayload,
  RedditImageEditor,
  RedditLinkEditor,
  RedditTextEditor,
  RedditVideoEditor,
  type RedditLinkPayload,
  type RedditMediaPayload,
  type RedditTextPayload,
} from "./editors/reddit-editors";
import { makeRedditPreview } from "./previews/reddit-preview";
import { mediaExportFiles } from "./export-helpers";
import type { ChannelCapability } from "./types";

const RedditTextPreview = makeRedditPreview("self");
const RedditLinkPreview = makeRedditPreview("link");
const RedditImagePreview = makeRedditPreview("image");
const RedditVideoPreview = makeRedditPreview("video");

const baseMeta = {
  subreddit: "",
  flairId: "",
  flairText: "",
  nsfw: false,
  spoiler: false,
};

const reddit: ChannelCapability = {
  channel: "reddit",
  forms: [
    {
      id: "text",
      label: "Text",
      limits: { maxChars: 40000 },
      hydrate: ({ content }): StudioPayload => {
        const lines = content.split("\n");
        const first = lines[0]?.trim() ?? "";
        const hasTitle = first.length > 0 && first.length <= 300;
        const title = hasTitle ? first : "";
        const body = hasTitle ? lines.slice(1).join("\n").trimStart() : content;
        const payload: RedditTextPayload = { ...baseMeta, title, body };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { title, body } = readRedditTextPayload(payload);
        return {
          text: [title, body].filter(Boolean).join("\n\n"),
          media: [],
        };
      },
      publish: async ({ workspaceId, payload }) => {
        const p = readRedditTextPayload(payload);
        if (!p.subreddit.trim()) throw new Error("Pick a subreddit.");
        if (!p.title.trim()) throw new Error("Give your post a title.");
        return publishRedditText({
          workspaceId,
          subreddit: p.subreddit,
          title: p.title,
          body: p.body,
          flairId: p.flairId || undefined,
          nsfw: p.nsfw,
          spoiler: p.spoiler,
        });
      },
      Editor: RedditTextEditor,
      Preview: RedditTextPreview,
    },
    {
      id: "link",
      label: "Link",
      limits: { maxChars: 300 },
      hydrate: ({ content }): StudioPayload => {
        // Best-effort: if content is a single URL, pre-fill the link field.
        const trimmed = content.trim();
        const isUrl = /^https?:\/\//i.test(trimmed) && !/\s/.test(trimmed);
        const payload: RedditLinkPayload = {
          ...baseMeta,
          title: isUrl ? "" : content.split("\n")[0]?.slice(0, 300) ?? "",
          link: isUrl ? trimmed : "",
        };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { title, link } = readRedditLinkPayload(payload);
        return {
          text: [title, link].filter(Boolean).join("\n\n"),
          media: [],
        };
      },
      publish: async ({ workspaceId, payload }) => {
        const p = readRedditLinkPayload(payload);
        if (!p.subreddit.trim()) throw new Error("Pick a subreddit.");
        if (!p.title.trim()) throw new Error("Give your post a title.");
        if (!p.link.trim()) throw new Error("Add a destination link.");
        return publishRedditLink({
          workspaceId,
          subreddit: p.subreddit,
          title: p.title,
          url: p.link,
          flairId: p.flairId || undefined,
          nsfw: p.nsfw,
          spoiler: p.spoiler,
        });
      },
      Editor: RedditLinkEditor,
      Preview: RedditLinkPreview,
    },
    {
      id: "image",
      label: "Image",
      limits: { maxMedia: 1, requiresMedia: true },
      hydrate: ({ content, media }): StudioPayload => {
        const payload: RedditMediaPayload = {
          ...baseMeta,
          title: content.split("\n")[0]?.slice(0, 300) ?? "",
          media: media.filter((m) => m.mimeType.startsWith("image/")).slice(0, 1),
        };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { title, media } = readRedditMediaPayload(payload);
        return { text: title, media };
      },
      publish: async ({ workspaceId, payload }) => {
        const p = readRedditMediaPayload(payload);
        if (!p.subreddit.trim()) throw new Error("Pick a subreddit.");
        if (!p.title.trim()) throw new Error("Give your post a title.");
        if (p.media.length === 0) throw new Error("Upload an image.");
        return publishRedditImage({
          workspaceId,
          subreddit: p.subreddit,
          title: p.title,
          image: p.media[0],
          flairId: p.flairId || undefined,
          nsfw: p.nsfw,
          spoiler: p.spoiler,
        });
      },
      exportPayload: (payload) => {
        const { title, media } = readRedditMediaPayload(payload);
        return mediaExportFiles(media, title ? `reddit-${title}` : "reddit-image");
      },
      Editor: RedditImageEditor,
      Preview: RedditImagePreview,
    },
    {
      id: "video",
      label: "Video",
      limits: { maxMedia: 1, requiresMedia: true },
      hydrate: ({ content, media }): StudioPayload => {
        const payload: RedditMediaPayload = {
          ...baseMeta,
          title: content.split("\n")[0]?.slice(0, 300) ?? "",
          media: media.filter((m) => m.mimeType.startsWith("video/")).slice(0, 1),
        };
        return payload as unknown as StudioPayload;
      },
      flatten: (payload): { text: string; media: PostMedia[] } => {
        const { title, media } = readRedditMediaPayload(payload);
        return { text: title, media };
      },
      publish: async ({ workspaceId, payload }) => {
        const p = readRedditMediaPayload(payload);
        if (!p.subreddit.trim()) throw new Error("Pick a subreddit.");
        if (!p.title.trim()) throw new Error("Give your post a title.");
        if (p.media.length === 0) throw new Error("Upload a video.");
        return publishRedditVideo({
          workspaceId,
          subreddit: p.subreddit,
          title: p.title,
          video: p.media[0],
          flairId: p.flairId || undefined,
          nsfw: p.nsfw,
          spoiler: p.spoiler,
        });
      },
      exportPayload: (payload) => {
        const { title, media } = readRedditMediaPayload(payload);
        return mediaExportFiles(media, title ? `reddit-${title}` : "reddit-video");
      },
      Editor: RedditVideoEditor,
      Preview: RedditVideoPreview,
    },
  ],
};

export { reddit };
