// Platforms surfaced in the extension's capture popup. A curated subset
// of the web app's full channel list — broad enough to cover most
// creators, narrow enough to fit comfortably in a 380px popup. Keep in
// sync with the platforms supported by /api/ai/import; that endpoint
// accepts any string but we only show ones the fanout prompt has
// constraints for in `lib/ai/voice-context.ts`.

export type CapturePlatform = {
  id: string;
  name: string;
  blurb: string;
};

export const CAPTURE_PLATFORMS: CapturePlatform[] = [
  { id: "twitter", name: "X", blurb: "280-char punchy hook" },
  { id: "linkedin", name: "LinkedIn", blurb: "Hook + a few beats" },
  { id: "instagram", name: "Instagram", blurb: "Warm caption" },
  { id: "threads", name: "Threads", blurb: "Conversational" },
  { id: "bluesky", name: "Bluesky", blurb: "Short, authentic" },
  { id: "facebook", name: "Facebook", blurb: "Long-form OK" },
  { id: "mastodon", name: "Mastodon", blurb: "Federated post" },
  { id: "medium", name: "Medium", blurb: "Article-shaped" },
];

export const DEFAULT_TARGETS = ["twitter", "linkedin"] as const;
