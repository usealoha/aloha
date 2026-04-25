import type { PostMedia, StudioPayload } from "@/db/schema";
import { publishFacebookReel, publishToFacebook } from "@/lib/publishers/facebook";
import {
  makePostEditor,
  readPostPayload,
  type PostPayload,
} from "./editors/post-editor";
import {
  ReelEditor,
  readReelPayload,
  type ReelPayload,
} from "./editors/reel-editor";
import { makePostPreview } from "./previews/post-preview";
import { ReelPreview } from "./previews/reel-preview";
import { mediaExportFiles } from "./export-helpers";
import type { ChannelCapability } from "./types";

// Facebook's Graph API accepts up to 63206 chars in `message`. The 500
// "Post" target matches the feed truncation point (Facebook shows "See
// more" beyond ~480 chars). Soft target, not enforced — authors can
// overflow into Long post if they prefer the larger editor affordance.
const FacebookPostEditor = makePostEditor({
  maxChars: 500,
  label: "Post",
  placeholder: "What's on your mind?",
});
const FacebookLongEditor = makePostEditor({
  maxChars: 63206,
  label: "Long post",
  placeholder: "Write your post…",
});
const FacebookPreview = makePostPreview("facebook");

const publishPayload = async (args: {
  workspaceId: string;
  payload: StudioPayload;
}) => {
  const { text, media } = readPostPayload(args.payload);
  return publishToFacebook({ workspaceId: args.workspaceId, text, media });
};

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
      publish: publishPayload,
      exportPayload: (payload) =>
        mediaExportFiles(readPostPayload(payload).media, "facebook-post"),
      Editor: FacebookPostEditor,
      Preview: FacebookPreview,
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
      publish: publishPayload,
      exportPayload: (payload) =>
        mediaExportFiles(readPostPayload(payload).media, "facebook-longpost"),
      Editor: FacebookLongEditor,
      Preview: FacebookPreview,
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
      publish: async ({ workspaceId, payload }) => {
        const { caption, video } = readReelPayload(payload);
        if (video.length === 0) {
          throw new Error("Reels need a video.");
        }
        return publishFacebookReel({
          workspaceId,
          description: caption,
          video: video[0],
        });
      },
      exportPayload: (payload) =>
        mediaExportFiles(readReelPayload(payload).video, "facebook-reel"),
      Editor: ReelEditor,
      Preview: ReelPreview,
    },
  ],
};

export { facebook };
