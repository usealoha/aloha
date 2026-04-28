// Instagram assisted-publish content script.
//
// Caveat: Instagram's web composer requires the user to upload an
// image before the caption field is reachable. We rely on the user
// having gotten as far as the caption step; the popup's "Use this"
// button asks the content script if compose is active before
// allowing prefill, so the no-editor case shows a hint instead of a
// silent failure.
//
// Image attachment via DataTransfer is brittle and edges into
// automation territory we said we wouldn't enter. The shared
// machinery copies the image URL to the clipboard so the user can
// download + re-upload manually if needed.

import { startComposeContentScript } from "./common/script";

startComposeContentScript({
  platform: "Instagram",
  platformKey: "instagram",
  composeSelectors: [
    // Modern caption field on the create modal.
    {
      surface: "main",
      selector: 'textarea[aria-label*="caption" i]',
      elementKind: "textarea",
    },
    // Some redesigns use a contenteditable instead.
    {
      surface: "main",
      selector: 'div[aria-label*="caption" i][contenteditable="true"]',
      elementKind: "contenteditable",
    },
    {
      surface: "main",
      selector: 'div[role="textbox"][contenteditable="true"]',
      elementKind: "contenteditable",
    },
  ],
});
