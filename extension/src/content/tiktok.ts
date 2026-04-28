// TikTok assisted-publish content script. The web upload page lives
// at /upload — the user uploads a video first, then lands on a screen
// with a caption editor. Our prefill targets that caption.
//
// Same image-attachment caveat as Instagram: video upload via
// DataTransfer is fragile and not worth the brittleness. We focus on
// caption + link, leaving file selection to the user.

import { startComposeContentScript } from "./common/script";

startComposeContentScript({
  platform: "TikTok",
  platformKey: "tiktok",
  composeSelectors: [
    // 2024 caption editor — TikTok exposes a contenteditable with a
    // `data-e2e` hook for the upload caption.
    {
      surface: "main",
      selector: 'div[data-e2e="upload-caption"]',
      elementKind: "contenteditable",
    },
    // Newer wrapping — sometimes a contenteditable is nested inside a
    // labeled region.
    {
      surface: "main",
      selector: 'div[contenteditable="true"][data-text="true"]',
      elementKind: "contenteditable",
    },
    {
      surface: "main",
      selector:
        'div[aria-label*="caption" i][contenteditable="true"]',
      elementKind: "contenteditable",
    },
  ],
});
