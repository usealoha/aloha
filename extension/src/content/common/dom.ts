// Safe DOM prefill helpers for assisted-manual posting. Same pattern
// 1Password and Grammarly use to inject values into third-party forms
// without crossing into "automation" territory:
//
// 1. We never click submit. The user does. We only fill the field.
// 2. We bypass React's controlled-input value tracking by going through
//    the prototype's value setter, then dispatch a synthetic input
//    event so the platform's framework re-renders with the new value.
// 3. We bail early on disabled / readOnly inputs and let the caller
//    drop to a clipboard fallback.
//
// `degrades_to_clipboard` is the explicit failsafe contract: when a
// platform redesigns selectors, we copy text + media URLs to the
// clipboard and toast the user so they can paste manually instead of
// the prefill silently failing.

export type PrefillResult =
  | { ok: true; method: "textarea" | "input" | "contenteditable" }
  | { ok: false; reason: "no-element" | "disabled" | "exception" };

export function prefillTextarea(
  el: HTMLTextAreaElement,
  value: string,
): PrefillResult {
  if (el.disabled || el.readOnly) {
    return { ok: false, reason: "disabled" };
  }
  try {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    if (!setter) return { ok: false, reason: "exception" };
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return { ok: true, method: "textarea" };
  } catch {
    return { ok: false, reason: "exception" };
  }
}

export function prefillInput(
  el: HTMLInputElement,
  value: string,
): PrefillResult {
  if (el.disabled || el.readOnly) {
    return { ok: false, reason: "disabled" };
  }
  try {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    if (!setter) return { ok: false, reason: "exception" };
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return { ok: true, method: "input" };
  } catch {
    return { ok: false, reason: "exception" };
  }
}

// Contenteditable prefill. Works for LinkedIn's share-box, Medium's
// editor body, and most rich editors. We focus the element, select
// everything, and use `insertText` to replace the selection — this
// triggers the editor's own input handlers (paragraph wrapping, etc.)
// which a direct innerText assignment would skip.
export function prefillContenteditable(
  el: HTMLElement,
  value: string,
): PrefillResult {
  if (el.getAttribute("contenteditable") === "false") {
    return { ok: false, reason: "disabled" };
  }
  try {
    el.focus();
    const selection = window.getSelection();
    if (!selection) return { ok: false, reason: "exception" };
    const range = document.createRange();
    range.selectNodeContents(el);
    selection.removeAllRanges();
    selection.addRange(range);

    // execCommand is deprecated but still fires the editor's onChange
    // hook on every major rich-text site. The MDN-blessed
    // alternative (Selection + Range.insertNode) doesn't trigger
    // framework state updates on its own, which is the whole point
    // of going through the editor in the first place.
    const ok = document.execCommand("insertText", false, value);
    if (!ok) {
      // Fallback: replace text content directly + dispatch input.
      el.textContent = value;
      el.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }
    return { ok: true, method: "contenteditable" };
  } catch {
    return { ok: false, reason: "exception" };
  }
}

// Copies plain text to the user's clipboard as a backup path. Returns
// false when blocked (some sites override the clipboard API). We never
// reject in the calling content script — the user gets a toast either
// way.
export async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older fallback via execCommand on a hidden textarea. Works on
    // virtually every site that blocks the modern API.
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText =
        "position:fixed;top:0;left:0;opacity:0;pointer-events:none;";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

// Renders a transient toast pinned to the bottom-right of the viewport.
// Used by content scripts to communicate with the user without needing
// the popup open. Auto-dismisses; no host-page CSS interference because
// we inline-style everything and use a top-of-stack z-index.
export function showToast(
  message: string,
  options: { variant?: "info" | "warn"; durationMs?: number } = {},
): void {
  const { variant = "info", durationMs = 3500 } = options;
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.setAttribute("role", "status");
  toast.style.cssText = [
    "position:fixed",
    "bottom:24px",
    "right:24px",
    "max-width:320px",
    "padding:12px 16px",
    `background:${variant === "warn" ? "#fbe6cf" : "#1a1612"}`,
    `color:${variant === "warn" ? "#1a1612" : "#fffdf6"}`,
    `border:${variant === "warn" ? "1px solid #f4c896" : "none"}`,
    "border-radius:999px",
    "font:500 13px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
    "z-index:2147483647",
    "box-shadow:0 12px 32px rgba(0,0,0,0.18)",
    "transition:opacity .25s ease, transform .25s ease",
    "transform:translateY(8px)",
    "opacity:0",
  ].join(";");
  document.body.appendChild(toast);
  // Defer to next frame so the transition triggers cleanly.
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(() => toast.remove(), 300);
  }, durationMs);
}
