// Bookmarklet pop-up landing page. Shown for ~1s after the clip endpoint
// redirects here, then closes itself. The bookmarklet on the host page
// renders its own toast — we only need a brief confirmation here in case
// the auto-close fails.

import { Check } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ClippedPopupPage() {
  return (
    <main className="min-h-screen grid place-items-center bg-background text-ink p-6">
      <div className="text-center space-y-3 max-w-xs">
        <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-peach-100 border border-peach-300">
          <Check className="w-5 h-5 text-ink/80" />
        </span>
        <h1 className="font-display text-[22px] leading-[1.1] tracking-[-0.02em]">
          Saved to Aloha
        </h1>
        <p className="text-[12.5px] text-ink/60 leading-[1.55]">
          You can close this window. We&apos;ll tidy up automatically in a
          second.
        </p>
      </div>
      {/*
        Self-closing on a short timer. We can't put this in a useEffect
        because rendering this page server-side keeps the bundle small.
        The script runs immediately and only attempts close() — browsers
        only allow close() on script-opened windows, which the
        bookmarklet's window.open(...) qualifies as.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `setTimeout(function(){try{window.close();}catch(e){}},1000);`,
        }}
      />
    </main>
  );
}
