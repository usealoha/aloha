import "server-only";

import { publishBlueskyThread, publishToBluesky } from "@/lib/publishers/bluesky";
import { publishFacebookReel, publishToFacebook } from "@/lib/publishers/facebook";
import {
  publishInstagramReel,
  publishInstagramStory,
  publishToInstagram,
} from "@/lib/publishers/instagram";
import {
  publishLinkedInDocument,
  publishToLinkedIn,
} from "@/lib/publishers/linkedin";
import {
  publishMastodonThread,
  publishToMastodon,
} from "@/lib/publishers/mastodon";
import { publishToMedium } from "@/lib/publishers/medium";
import { publishToPinterest } from "@/lib/publishers/pinterest";
import {
  publishRedditImage,
  publishRedditLink,
  publishRedditText,
  publishRedditVideo,
} from "@/lib/publishers/reddit";
import {
  publishThreadsThread,
  publishToThreads,
} from "@/lib/publishers/threads";
import { publishToTikTok } from "@/lib/publishers/tiktok";
import { publishToX, publishXPoll, publishXThread } from "@/lib/publishers/x";
import { publishToYouTube } from "@/lib/publishers/youtube";

import { readArticlePayload } from "./editors/article-payload";
import { readDocumentPayload } from "./editors/document-payload";
import { readPinPayload } from "./editors/pin-payload";
import { readPostPayload } from "./editors/post-payload";
import {
  readRedditLinkPayload,
  readRedditMediaPayload,
  readRedditTextPayload,
} from "./editors/reddit-payload";
import { readReelPayload } from "./editors/reel-payload";
import { readStoryPayload } from "./editors/story-payload";
import { readThreadPayload } from "./editors/thread-payload";
import { readTikTokPayload } from "./editors/tiktok-payload";
import { readShortPayload } from "./editors/short-payload";
import { readXPollPayload } from "./editors/x-poll-payload";

import type { PublishArgs, PublishResult } from "./types";

export type FormPublisher = (args: PublishArgs) => Promise<PublishResult>;

const REGISTRY: Record<string, FormPublisher> = {
  "twitter:post": async ({ workspaceId, payload }) => {
    const { text, media } = readPostPayload(payload);
    return publishToX({ workspaceId, text, media });
  },
  "twitter:longpost": async ({ workspaceId, payload }) => {
    const { text, media } = readPostPayload(payload);
    return publishToX({ workspaceId, text, media });
  },
  "twitter:thread": async ({ workspaceId, payload }) => {
    const { parts } = readThreadPayload(payload);
    const nonEmpty = parts.filter((p) => p.text.trim().length > 0);
    if (nonEmpty.length === 1) {
      return publishToX({
        workspaceId,
        text: nonEmpty[0].text,
        media: nonEmpty[0].media,
      });
    }
    return publishXThread({ workspaceId, parts: nonEmpty });
  },
  "twitter:poll": async ({ workspaceId, payload }) => {
    const { text, options, durationMinutes } = readXPollPayload(payload);
    const cleaned = options.map((o) => o.trim()).filter(Boolean);
    if (cleaned.length < 2) {
      throw new Error("Poll needs at least two options.");
    }
    return publishXPoll({ workspaceId, text, options: cleaned, durationMinutes });
  },

  "bluesky:post": async ({ workspaceId, payload }) => {
    const { text, media } = readPostPayload(payload);
    return publishToBluesky({ workspaceId, text, media });
  },
  "bluesky:thread": async ({ workspaceId, payload }) => {
    const { parts } = readThreadPayload(payload);
    const nonEmpty = parts.filter((p) => p.text.trim().length > 0);
    if (nonEmpty.length === 1) {
      return publishToBluesky({
        workspaceId,
        text: nonEmpty[0].text,
        media: nonEmpty[0].media,
      });
    }
    return publishBlueskyThread({ workspaceId, parts: nonEmpty });
  },

  "threads:post": async ({ workspaceId, payload }) => {
    const { text, media } = readPostPayload(payload);
    return publishToThreads({ workspaceId, text, media });
  },
  "threads:thread": async ({ workspaceId, payload }) => {
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

  "mastodon:post": async ({ workspaceId, payload }) => {
    const { text, media, spoilerText } = readPostPayload(payload);
    return publishToMastodon({
      workspaceId,
      text,
      media,
      spoilerText: spoilerText || undefined,
    });
  },
  "mastodon:thread": async ({ workspaceId, payload }) => {
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

  "linkedin:post": async ({ workspaceId, payload }) => {
    const { text, media } = readPostPayload(payload);
    return publishToLinkedIn({ workspaceId, text, media });
  },
  "linkedin:longform": async ({ workspaceId, payload }) => {
    const { text, media } = readPostPayload(payload);
    return publishToLinkedIn({ workspaceId, text, media });
  },
  "linkedin:document": async ({ workspaceId, payload }) => {
    const { title, caption, document } = readDocumentPayload(payload);
    if (document.length === 0) {
      throw new Error("Upload a PDF before publishing.");
    }
    if (!title.trim()) {
      throw new Error("Give your document a title.");
    }
    return publishLinkedInDocument({
      workspaceId,
      text: caption,
      title,
      document: document[0],
    });
  },

  "facebook:post": async ({ workspaceId, payload }) => {
    const { text, media } = readPostPayload(payload);
    return publishToFacebook({ workspaceId, text, media });
  },
  "facebook:longpost": async ({ workspaceId, payload }) => {
    const { text, media } = readPostPayload(payload);
    return publishToFacebook({ workspaceId, text, media });
  },
  "facebook:reel": async ({ workspaceId, payload }) => {
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

  "instagram:feed": async ({ workspaceId, payload }) => {
    const { text, media } = readPostPayload(payload);
    if (media.length === 0) {
      throw new Error("Instagram posts need at least one image or video.");
    }
    return publishToInstagram({ workspaceId, text, media });
  },
  "instagram:reel": async ({ workspaceId, payload }) => {
    const { caption, video, shareToFeed } = readReelPayload(payload);
    if (video.length === 0) {
      throw new Error("Reels need a video.");
    }
    return publishInstagramReel({
      workspaceId,
      caption,
      video: video[0],
      shareToFeed,
    });
  },
  "instagram:story": async ({ workspaceId, payload }) => {
    const { media } = readStoryPayload(payload);
    if (media.length === 0) {
      throw new Error("Stories need an image or video.");
    }
    return publishInstagramStory({ workspaceId, media: media[0] });
  },

  "medium:article": async ({ workspaceId, payload }) => {
    const { title, body, media } = readArticlePayload(payload);
    if (!title.trim()) {
      throw new Error("Give your article a title before publishing.");
    }
    return publishToMedium({ workspaceId, title, text: body, media });
  },

  "pinterest:pin": async ({ workspaceId, payload }) => {
    const { title, description, link, media } = readPinPayload(payload);
    if (media.length === 0) {
      throw new Error("Pins need a cover image.");
    }
    if (!title.trim()) {
      throw new Error("Give your pin a title.");
    }
    return publishToPinterest({
      workspaceId,
      text: description || title,
      title,
      description,
      media,
      link: link || null,
    });
  },

  "tiktok:video": async ({ workspaceId, payload }) => {
    const t = readTikTokPayload(payload);
    if (t.video.length === 0) {
      throw new Error("TikTok posts need a video.");
    }
    return publishToTikTok({
      workspaceId,
      title: t.title,
      video: t.video[0],
      privacyLevel: t.privacyLevel,
      disableComment: t.disableComment,
      disableDuet: t.disableDuet,
      disableStitch: t.disableStitch,
      brandContentToggle: t.brandContentToggle,
      brandOrganicToggle: t.brandOrganicToggle,
    });
  },

  "youtube:short": async ({ workspaceId, payload }) => {
    const { title, description, video } = readShortPayload(payload);
    if (video.length === 0) {
      throw new Error("Shorts need a video.");
    }
    if (!title.trim()) {
      throw new Error("Give your Short a title.");
    }
    return publishToYouTube({
      workspaceId,
      text: description,
      title,
      description,
      media: video,
    });
  },

  "reddit:text": async ({ workspaceId, payload }) => {
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
  "reddit:link": async ({ workspaceId, payload }) => {
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
  "reddit:image": async ({ workspaceId, payload }) => {
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
  "reddit:video": async ({ workspaceId, payload }) => {
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
};

export function getFormPublisher(
  channel: string,
  formId: string,
): FormPublisher | null {
  return REGISTRY[`${channel}:${formId}`] ?? null;
}
