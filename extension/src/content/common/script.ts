// Shared content-script machinery. Each platform (LinkedIn, Instagram,
// TikTok, Medium) registers its own selector list + a few platform-
// specific behaviors and gets the rest for free: prefill via the safe
// DOM helpers, clipboard fallback, submit-detection observer, and
// chrome.runtime message wiring.

import {
  prefillContenteditable,
  prefillInput,
  prefillTextarea,
  showToast,
  writeClipboard,
} from "./dom";
import type {
  ContentInboundMessage,
  IsComposeActiveResponse,
  PrefillResponse,
  SubmittedReport,
} from "../../shared/messages";
import type { PostMedia } from "@aloha/db/schema";

export type ComposeMatch = {
  element: HTMLElement;
  surface: "feed" | "page" | "main";
};

export type ComposeStrategy = {
  // Human-readable platform name shown in toasts ("LinkedIn", "Medium").
  platform: string;
  // Matches the platform key on the Aloha side ("linkedin", "medium").
  platformKey: string;
  // Ordered list of selectors. First match wins. Each entry can also
  // declare which kind of element it returns so we know which prefill
  // helper to apply.
  composeSelectors: readonly {
    surface: ComposeMatch["surface"];
    selector: string;
    elementKind: "textarea" | "input" | "contenteditable";
  }[];
  // Optional override for media handling. By default, copy the first
  // asset URL to clipboard with a "paste on …" hint. Some platforms
  // (Medium) don't make sense for media-via-clipboard.
  mediaHint?: (media: PostMedia[]) => Promise<void>;
};

export function startComposeContentScript(strategy: ComposeStrategy): void {
  let activeWatcher: (() => void) | null = null;

  function findCompose():
    | (ComposeMatch & { kind: "textarea" | "input" | "contenteditable" })
    | null {
    for (const { surface, selector, elementKind } of strategy.composeSelectors) {
      const el = document.querySelector<HTMLElement>(selector);
      if (el && isVisible(el)) {
        return { element: el, surface, kind: elementKind };
      }
    }
    return null;
  }

  function isVisible(el: HTMLElement): boolean {
    if (!el.isConnected) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  // Submit detection: when the compose element disappears OR its text
  // is cleared while it's still around. Both are heuristics — different
  // platforms close vs clear post-publish, so we watch for either.
  function watchForSubmit(args: {
    target: HTMLElement;
    postId: string;
    deliveryId: string;
  }): () => void {
    const { target, postId, deliveryId } = args;
    let fired = false;

    const fire = () => {
      if (fired) return;
      fired = true;
      const msg: SubmittedReport = {
        kind: "aloha:submitted",
        postId,
        deliveryId,
        platform: strategy.platformKey,
      };
      chrome.runtime.sendMessage(msg).catch(() => {
        // Background may be asleep; popup re-fetches on next open.
      });
    };

    const observer = new MutationObserver(() => {
      if (fired) return;
      if (!document.contains(target)) {
        const lastText = (target.textContent ?? "").trim();
        if (lastText.length > 0) fire();
        cleanup();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const timer = window.setTimeout(() => cleanup(), 5 * 60 * 1000);

    const cleanup = () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
    return cleanup;
  }

  async function handlePrefill(
    msg: Extract<ContentInboundMessage, { kind: "aloha:prefill" }>,
  ): Promise<PrefillResponse> {
    const target = findCompose();
    if (!target) {
      const fallback = composeFallbackText(msg.content, msg.media);
      const copied = await writeClipboard(fallback);
      showToast(
        copied
          ? `Selectors changed — content copied. Open ${strategy.platform}'s composer and paste.`
          : `Selectors changed and clipboard is blocked. Copy from Aloha manually.`,
        { variant: "warn", durationMs: 6000 },
      );
      return { ok: false, clipboard: copied, reason: "no-element" };
    }

    const result =
      target.kind === "textarea"
        ? prefillTextarea(target.element as HTMLTextAreaElement, msg.content)
        : target.kind === "input"
          ? prefillInput(target.element as HTMLInputElement, msg.content)
          : prefillContenteditable(target.element, msg.content);

    if (!result.ok) {
      const copied = await writeClipboard(msg.content);
      showToast(
        copied
          ? "Couldn't fill the editor — content copied to clipboard."
          : "Couldn't fill the editor.",
        { variant: "warn", durationMs: 6000 },
      );
      return { ok: false, clipboard: copied, reason: result.reason };
    }

    if (msg.media.length > 0) {
      if (strategy.mediaHint) {
        await strategy.mediaHint(msg.media);
      } else {
        const first = msg.media[0];
        if (first) {
          const copied = await writeClipboard(first.url);
          showToast(
            copied
              ? `Text filled. Media URL on clipboard — paste in ${strategy.platform}'s media picker.`
              : `Text filled. Media available in Aloha — open and download to attach.`,
            { durationMs: 5000 },
          );
        }
      }
    } else {
      showToast(`Filled by Aloha. Review and click Post.`, {
        durationMs: 3000,
      });
    }

    activeWatcher?.();
    activeWatcher = watchForSubmit({
      target: target.element,
      postId: msg.postId,
      deliveryId: msg.deliveryId,
    });

    return { ok: true, method: result.method };
  }

  chrome.runtime.onMessage.addListener(
    (
      raw: unknown,
      _sender,
      sendResponse: (resp: PrefillResponse | IsComposeActiveResponse) => void,
    ) => {
      const msg = raw as ContentInboundMessage;
      if (!msg || typeof msg !== "object" || !("kind" in msg)) return;

      if (msg.kind === "aloha:prefill") {
        void handlePrefill(msg).then(sendResponse);
        return true;
      }
      if (msg.kind === "aloha:is-compose-active") {
        const detected = findCompose();
        sendResponse(
          detected
            ? { active: true, surface: detected.surface }
            : { active: false },
        );
        return false;
      }
      return undefined;
    },
  );
}

function composeFallbackText(content: string, media: PostMedia[]): string {
  if (media.length === 0) return content;
  const first = media[0];
  if (!first) return content;
  return `${content}\n\n${first.url}`.trim();
}
