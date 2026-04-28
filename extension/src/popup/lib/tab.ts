// Reads the active tab's URL + page title + current selection. Used by
// the capture flow to seed the import request. The selection read runs
// inside the page via `chrome.scripting.executeScript` because the
// popup itself has no DOM access to the underlying tab.
//
// On chrome:// pages, devtools windows, the New Tab page, and PDFs
// served from disk, scripting is blocked — we degrade to URL-only.

export type TabSnapshot = {
  url: string;
  title: string | null;
  selection: string | null;
  // Set when the URL is one we can't act on (chrome:// scheme, etc).
  // Capture flow refuses to run in that case; the user closes the popup
  // and tries on a real page.
  unsupportedReason: string | null;
};

const UNSUPPORTED_PROTOCOLS = new Set([
  "chrome:",
  "chrome-extension:",
  "edge:",
  "about:",
  "view-source:",
  "devtools:",
]);

export async function readActiveTab(): Promise<TabSnapshot | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) return null;

  let unsupportedReason: string | null = null;
  let parsed: URL | null = null;
  try {
    parsed = new URL(tab.url);
    if (UNSUPPORTED_PROTOCOLS.has(parsed.protocol)) {
      unsupportedReason = "We can't capture from browser pages.";
    }
  } catch {
    unsupportedReason = "That URL doesn't look right.";
  }

  let selection: string | null = null;
  if (!unsupportedReason && tab.id !== undefined) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection()?.toString() ?? "",
      });
      const text = results[0]?.result?.trim() ?? "";
      if (text) selection = text;
    } catch {
      // Page disallows script injection (some Chrome internal tabs).
      // Keep going with URL-only — selection isn't required.
    }
  }

  return {
    url: tab.url,
    title: tab.title ?? null,
    selection,
    unsupportedReason,
  };
}
