"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SyncNotionButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors disabled:opacity-70 disabled:cursor-progress"
    >
      {pending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <RefreshCw className="w-3.5 h-3.5" />
      )}
      {pending ? "Syncing…" : "Sync now"}
    </button>
  );
}
