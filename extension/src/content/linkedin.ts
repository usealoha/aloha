// LinkedIn assisted-publish content script. Selectors only — the
// shared machinery in `./common/script` handles prefill, clipboard
// fallback, submit detection, and message wiring. New selectors land
// here as LinkedIn ships redesigns; ordering matters — broader
// fallbacks at the bottom so a redesign doesn't accidentally hijack a
// different surface like a comment composer.

import { startComposeContentScript } from "./common/script";

startComposeContentScript({
  platform: "LinkedIn",
  platformKey: "linkedin",
  composeSelectors: [
    // 2024+ share box — personal feed + Pages share modal share the
    // same shape.
    {
      surface: "feed",
      selector:
        'div.share-creation-state__text-editor [contenteditable="true"]',
      elementKind: "contenteditable",
    },
    {
      surface: "feed",
      selector: '[data-test-id="share-box"] [contenteditable="true"]',
      elementKind: "contenteditable",
    },
    {
      surface: "feed",
      selector: 'div.ql-editor[contenteditable="true"]',
      elementKind: "contenteditable",
    },
    {
      surface: "feed",
      selector:
        'div[aria-label*="text editor" i][contenteditable="true"]',
      elementKind: "contenteditable",
    },
  ],
});
