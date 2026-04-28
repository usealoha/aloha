// Medium assisted-publish content script.
//
// Medium's editor is a contenteditable with separate title and body
// regions. We prefill the body — articles are long-form, the title is
// usually authored on the platform itself, and Aloha's `content` field
// holds the prose body. The user picks a title in Medium afterwards.
//
// Media via clipboard is less useful here than on social platforms —
// Medium articles embed images via its own image picker. We keep the
// default media-hint behavior (URL on clipboard) so the user can still
// paste image links if useful, but the typical flow is body-only.

import { startComposeContentScript } from "./common/script";

startComposeContentScript({
  platform: "Medium",
  platformKey: "medium",
  composeSelectors: [
    // Body editor — paragraphs render as `p.graf--p` inside a region
    // labeled as the post body. Picking the wrapper is more stable
    // than targeting a specific paragraph.
    {
      surface: "main",
      selector: 'section[contenteditable="true"]',
      elementKind: "contenteditable",
    },
    {
      surface: "main",
      selector: 'div[role="textbox"][contenteditable="true"]',
      elementKind: "contenteditable",
    },
    {
      surface: "main",
      selector:
        'div[contenteditable="true"][data-testid*="editor" i]',
      elementKind: "contenteditable",
    },
  ],
});
