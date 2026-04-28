// Classifies the active tab into a publish-platform surface (when on a
// known compose page) or "capture" (everywhere else). Used by the
// popup's mode router and by future background-side compose detection.

export type PublishPlatform = "linkedin" | "instagram" | "tiktok" | "medium";

export type ActiveSurface =
  | { mode: "publish"; platform: PublishPlatform; tabId: number; url: string }
  | { mode: "capture"; tabId: number; url: string }
  | { mode: "unsupported"; tabId: number; url: string; reason: string };

const PUBLISH_MATCHERS: { platform: PublishPlatform; test: (url: URL) => boolean }[] = [
  {
    platform: "linkedin",
    test: (u) =>
      u.hostname.endsWith("linkedin.com") &&
      // Personal feed share, Pages share, or any URL that triggers a
      // share modal. We accept broadly because LinkedIn's compose
      // surfaces are consistently `?shareActive=true` or a path
      // containing /admin/feed/posts. The content script will refuse
      // the prefill if no editor is actually on the page.
      (u.searchParams.get("shareActive") === "true" ||
        u.pathname.startsWith("/feed") ||
        /\/company\/[^/]+\/admin\//.test(u.pathname)),
  },
  {
    platform: "instagram",
    test: (u) =>
      u.hostname.endsWith("instagram.com") &&
      (u.searchParams.get("action") === "create" ||
        u.pathname.startsWith("/create")),
  },
  {
    platform: "tiktok",
    test: (u) => u.hostname.endsWith("tiktok.com") && u.pathname === "/upload",
  },
  {
    platform: "medium",
    test: (u) =>
      u.hostname.endsWith("medium.com") &&
      (u.pathname === "/new-story" || u.pathname.startsWith("/p/")),
  },
];

export async function readActiveSurface(): Promise<ActiveSurface | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || tab.id === undefined || !tab.url) return null;

  let url: URL;
  try {
    url = new URL(tab.url);
  } catch {
    return {
      mode: "unsupported",
      tabId: tab.id,
      url: tab.url,
      reason: "Not a real URL.",
    };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return {
      mode: "unsupported",
      tabId: tab.id,
      url: tab.url,
      reason: "We can't act on browser pages.",
    };
  }

  for (const { platform, test } of PUBLISH_MATCHERS) {
    if (test(url)) {
      return {
        mode: "publish",
        platform,
        tabId: tab.id,
        url: tab.url,
      };
    }
  }
  return { mode: "capture", tabId: tab.id, url: tab.url };
}
