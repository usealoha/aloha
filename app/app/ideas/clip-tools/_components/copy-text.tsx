"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyText({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can be blocked; fall through silently — the user
      // can still select the text manually because it's rendered as an
      // input below.
    }
  };
  return (
    <div className="flex items-stretch gap-2">
      <input
        readOnly
        value={value}
        onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
        className="flex-1 min-w-0 h-10 px-3 rounded-full border border-border bg-background text-[12.5px] text-ink/80 font-mono focus:outline-none focus:border-ink"
      />
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-full border border-border bg-background text-[12.5px] font-medium text-ink hover:border-ink transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
