import { alohaUrl } from "../lib/api";

// Shown when the popup boots and discovers no session cookie. Opens a
// regular Aloha sign-in in a new tab; user signs in there, closes the
// tab, reopens the popup. The popup re-runs its auth probe on mount so
// the success path is implicit — no extension callback messaging needed.

export function SignInPrompt({ onRetry }: { onRetry: () => void }) {
  const openSignIn = async () => {
    const url = await alohaUrl("/auth/sign-in?callbackUrl=/app/dashboard");
    chrome.tabs.create({ url });
  };

  return (
    <div className="min-h-[320px] flex flex-col items-center justify-center px-6 py-8 text-center gap-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
        Aloha
      </p>
      <h1
        className="text-[22px] leading-[1.15] tracking-[-0.02em] text-ink"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Sign in to capture and publish from any page.
      </h1>
      <p className="text-[12.5px] text-ink-soft leading-[1.55]">
        We&apos;ll open Aloha in a tab. Sign in there, close the tab, and
        come back to this button.
      </p>
      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          onClick={openSignIn}
          className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
        >
          Open sign-in
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center h-10 px-4 rounded-full border border-border text-[13px] font-medium text-ink hover:border-ink transition-colors"
        >
          I&apos;m signed in
        </button>
      </div>
    </div>
  );
}
