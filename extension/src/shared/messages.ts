// Typed `chrome.runtime` / `chrome.tabs` messages exchanged between
// popup, background service worker, and content scripts. Every kind
// has a single source and one or more consumers; the discriminator
// keeps every handler exhaustive at the type level.

import type { PostMedia } from "@aloha/db/schema";

// ── Popup → Content script (via chrome.tabs.sendMessage) ───────────

export type PrefillRequest = {
  kind: "aloha:prefill";
  postId: string;
  deliveryId: string;
  platform: string;
  content: string;
  media: PostMedia[];
};

export type IsComposeActiveRequest = {
  kind: "aloha:is-compose-active";
};

export type ContentInboundMessage = PrefillRequest | IsComposeActiveRequest;

export type IsComposeActiveResponse = {
  active: boolean;
  surface?: "feed" | "page" | "main";
};

export type PrefillResponse =
  | { ok: true; method: "textarea" | "input" | "contenteditable" }
  | { ok: false; clipboard: boolean; reason: string };

// ── Content script → Background (via chrome.runtime.sendMessage) ───

export type SubmittedReport = {
  kind: "aloha:submitted";
  postId: string;
  deliveryId: string;
  platform: string;
};

export type ContentOutboundMessage = SubmittedReport;
