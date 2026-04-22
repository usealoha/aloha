"use client";

// Click-to-sync button for a connected channel's profile. Calls the server
// action via useTransition so we can show a spinner while it runs and fire
// success/error toasts once it completes. Replaces the plain form that
// previously had no visual feedback.

import { Loader2, RefreshCw } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { refreshChannelProfileAction } from "../../actions";

export function RefreshChannelButton({
  provider,
  channelName,
}: {
  provider: string;
  channelName: string;
}) {
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    if (pending) return;
    const toastId = toast.loading(`Syncing ${channelName}…`);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("provider", provider);
        await refreshChannelProfileAction(fd);
        toast.success(`${channelName} profile synced.`, { id: toastId });
      } catch (err) {
        toast.error(
          err instanceof Error
            ? `Couldn't sync ${channelName}: ${err.message}`
            : `Couldn't sync ${channelName}.`,
          { id: toastId },
        );
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      title="Refresh profile details"
      aria-label={`Refresh ${channelName} profile`}
      aria-busy={pending}
      className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-border-strong text-ink/70 hover:text-ink hover:border-ink disabled:opacity-60 disabled:cursor-wait transition-colors"
    >
      {pending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <RefreshCw className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
