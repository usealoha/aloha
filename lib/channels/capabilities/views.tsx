"use client";

import { makeArticleEditor } from "./editors/article-editor";
import { DocumentEditor } from "./editors/document-editor";
import { PinEditor } from "./editors/pin-editor";
import { makePostEditor } from "./editors/post-editor";
import {
  RedditImageEditor,
  RedditLinkEditor,
  RedditTextEditor,
  RedditVideoEditor,
} from "./editors/reddit-editors";
import { ReelEditor } from "./editors/reel-editor";
import { makeShortEditor } from "./editors/short-editor";
import { StoryEditor } from "./editors/story-editor";
import { makeThreadEditor } from "./editors/thread-editor";
import { TikTokEditor } from "./editors/tiktok-editor";
import { XPollEditor } from "./editors/x-poll-editor";

import { makeArticlePreview } from "./previews/article-preview";
import { DocumentPreview } from "./previews/document-preview";
import { PinPreview } from "./previews/pin-preview";
import { makePostPreview } from "./previews/post-preview";
import { makeRedditPreview } from "./previews/reddit-preview";
import { ReelPreview } from "./previews/reel-preview";
import { makeShortPreview } from "./previews/short-preview";
import { StoryPreview } from "./previews/story-preview";
import { makeThreadPreview } from "./previews/thread-preview";
import { TikTokPreview } from "./previews/tiktok-preview";
import { XPollPreview } from "./previews/x-poll-preview";

import type { FormView } from "./types";

const CW_FIELD = {
  label: "Content warning",
  placeholder: "Leave empty for no warning",
} as const;

const XPostEditor = makePostEditor({ maxChars: 280, label: "Post" });
const XLongEditor = makePostEditor({ maxChars: 25000, label: "Long post" });
const XThreadEditor = makeThreadEditor({ maxChars: 280, maxMediaPerPart: 4 });
const XPostPreview = makePostPreview("twitter");
const XThreadPreview = makeThreadPreview("twitter");

const BlueskyPostEditor = makePostEditor({ maxChars: 300, label: "Post" });
const BlueskyThreadEditor = makeThreadEditor({
  maxChars: 300,
  maxMediaPerPart: 4,
});
const BlueskyPostPreview = makePostPreview("bluesky");
const BlueskyThreadPreview = makeThreadPreview("bluesky");

const ThreadsPostEditor = makePostEditor({ maxChars: 500, label: "Post" });
const ThreadsThreadEditor = makeThreadEditor({
  maxChars: 500,
  maxMediaPerPart: 1,
});
const ThreadsPostPreview = makePostPreview("threads");
const ThreadsThreadPreview = makeThreadPreview("threads");

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

const LinkedInPostEditor = makePostEditor({
  maxChars: 1300,
  label: "Post",
  placeholder: "Share a post…",
});
const LinkedInLongEditor = makePostEditor({
  maxChars: 3000,
  label: "Long-form",
  placeholder: "What do you want to talk about?",
});
const LinkedInPreview = makePostPreview("linkedin");
const LinkedInDocumentPreview = DocumentPreview;

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

const InstagramFeedEditor = makePostEditor({
  maxChars: 2200,
  label: "Caption",
  placeholder: "Write a caption…",
  maxMedia: 10,
  acceptMedia: "image/*,video/*",
});
const InstagramFeedPreview = makePostPreview("instagram");

const MediumArticleEditor = makeArticleEditor({
  titlePlaceholder: "A headline worth clicking",
  bodyPlaceholder: "Tell the story. Markdown is supported.",
});
const MediumArticlePreview = makeArticlePreview("medium");

const YouTubeShortEditor = makeShortEditor({ descriptionMax: 5000 });
const YouTubeShortPreview = makeShortPreview("youtube");

const RedditTextPreview = makeRedditPreview("self");
const RedditLinkPreview = makeRedditPreview("link");
const RedditImagePreview = makeRedditPreview("image");
const RedditVideoPreview = makeRedditPreview("video");

const REGISTRY: Record<string, FormView> = {
  "twitter:post": { Editor: XPostEditor, Preview: XPostPreview },
  "twitter:longpost": { Editor: XLongEditor, Preview: XPostPreview },
  "twitter:thread": { Editor: XThreadEditor, Preview: XThreadPreview },
  "twitter:poll": { Editor: XPollEditor, Preview: XPollPreview },

  "bluesky:post": { Editor: BlueskyPostEditor, Preview: BlueskyPostPreview },
  "bluesky:thread": {
    Editor: BlueskyThreadEditor,
    Preview: BlueskyThreadPreview,
  },

  "threads:post": { Editor: ThreadsPostEditor, Preview: ThreadsPostPreview },
  "threads:thread": {
    Editor: ThreadsThreadEditor,
    Preview: ThreadsThreadPreview,
  },

  "mastodon:post": { Editor: MastodonPostEditor, Preview: MastodonPostPreview },
  "mastodon:thread": {
    Editor: MastodonThreadEditor,
    Preview: MastodonThreadPreview,
  },

  "linkedin:post": { Editor: LinkedInPostEditor, Preview: LinkedInPreview },
  "linkedin:longform": {
    Editor: LinkedInLongEditor,
    Preview: LinkedInPreview,
  },
  "linkedin:document": {
    Editor: DocumentEditor,
    Preview: LinkedInDocumentPreview,
  },

  "facebook:post": { Editor: FacebookPostEditor, Preview: FacebookPreview },
  "facebook:longpost": {
    Editor: FacebookLongEditor,
    Preview: FacebookPreview,
  },
  "facebook:reel": { Editor: ReelEditor, Preview: ReelPreview },

  "instagram:feed": {
    Editor: InstagramFeedEditor,
    Preview: InstagramFeedPreview,
  },
  "instagram:reel": { Editor: ReelEditor, Preview: ReelPreview },
  "instagram:story": { Editor: StoryEditor, Preview: StoryPreview },

  "medium:article": {
    Editor: MediumArticleEditor,
    Preview: MediumArticlePreview,
  },

  "pinterest:pin": { Editor: PinEditor, Preview: PinPreview },

  "tiktok:video": { Editor: TikTokEditor, Preview: TikTokPreview },

  "youtube:short": {
    Editor: YouTubeShortEditor,
    Preview: YouTubeShortPreview,
  },

  "reddit:text": { Editor: RedditTextEditor, Preview: RedditTextPreview },
  "reddit:link": { Editor: RedditLinkEditor, Preview: RedditLinkPreview },
  "reddit:image": { Editor: RedditImageEditor, Preview: RedditImagePreview },
  "reddit:video": { Editor: RedditVideoEditor, Preview: RedditVideoPreview },
};

export function getFormView(
  channel: string,
  formId: string,
): FormView | null {
  return REGISTRY[`${channel}:${formId}`] ?? null;
}
