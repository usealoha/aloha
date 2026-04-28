// MV3 service worker. Two responsibilities in v1:
//
// 1. Auto-pick the right base URL (dev vs prod) for API calls so the
//    same logic the popup uses also applies when the worker fires
//    completion calls without a popup open.
// 2. Receive `aloha:submitted` reports from content scripts after the
//    user clicks Post on a third-party platform, and PATCH the
//    matching delivery as published in Aloha.
//
// Workers are killed and respawned aggressively, so we don't keep
// long-lived state — every call re-derives the base URL.

const PROD_BASE = "https://usealoha.app";
const DEV_BASE = "http://localhost:5010";

let cachedBase: string | null = null;
async function pickBase(): Promise<string> {
  if (cachedBase) return cachedBase;
  try {
    const res = await fetch(`${DEV_BASE}/api/whoami`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok || res.status === 401) {
      cachedBase = DEV_BASE;
      return cachedBase;
    }
  } catch {
    // fall through
  }
  cachedBase = PROD_BASE;
  return cachedBase;
}

// Manifest version is injected at build time. We forward it to Aloha
// so the delivery row records which extension build did the assist —
// useful when telemetry shows a regression after a release.
const EXT_VERSION = chrome.runtime.getManifest().version;

self.addEventListener("install", () => {
  console.log("[aloha] background worker installed", EXT_VERSION);
});

chrome.runtime.onMessage.addListener((raw, _sender, sendResponse) => {
  if (
    !raw ||
    typeof raw !== "object" ||
    !("kind" in raw) ||
    (raw as { kind: string }).kind !== "aloha:submitted"
  ) {
    return undefined;
  }
  const msg = raw as {
    postId: string;
    deliveryId: string;
    platform: string;
  };

  void completeDelivery(msg).then((ok) => {
    sendResponse({ ok });
  });
  return true;
});

async function completeDelivery(args: {
  postId: string;
  platform: string;
}): Promise<boolean> {
  try {
    const base = await pickBase();
    const url = `${base}/api/posts/${encodeURIComponent(
      args.postId,
    )}/deliveries/${encodeURIComponent(args.platform)}/complete`;
    const res = await fetch(url, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Aloha-Extension": "1",
        "X-Aloha-Extension-Version": EXT_VERSION,
      },
    });
    if (!res.ok) {
      console.warn(
        "[aloha] complete-delivery failed",
        res.status,
        await res.text().catch(() => ""),
      );
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[aloha] complete-delivery threw", err);
    return false;
  }
}

export {};
