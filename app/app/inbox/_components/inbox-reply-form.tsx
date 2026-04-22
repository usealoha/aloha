"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { sendReply } from "@/app/actions/inbox";
import { Send } from "lucide-react";

// Guard rails for DM reply platforms we haven't finished wiring up. Keeps
// the composer locked with an honest "coming soon" label rather than
// letting a submit go out and then throw.
const DM_REPLY_COMING_SOON = new Set<string>(["facebook"]);

export function InboxReplyForm({
  messageId,
  platform,
  reason,
}: {
  messageId: string;
  platform: string;
  reason: "mention" | "dm";
}) {
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();

  const locked = reason === "dm" && DM_REPLY_COMING_SOON.has(platform);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || pending || locked) return;

    const toastId = toast.loading("Sending reply…");
    startTransition(async () => {
      try {
        await sendReply(messageId, content.trim());
        toast.success("Reply sent.", { id: toastId });
        setContent("");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Couldn't send reply.",
          { id: toastId },
        );
      }
    });
  }

  if (locked) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong bg-muted/30 px-4 py-3 text-[13px] text-ink/55 text-center">
        Replying to {platform.charAt(0).toUpperCase() + platform.slice(1)} DMs
        — <span className="font-medium text-ink/70">coming soon</span>.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a reply..."
        rows={2}
        className="flex-1 resize-none rounded-xl bg-background-elev border border-border-strong px-3.5 py-2.5 text-[14px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink transition-colors"
      />
      <button
        type="submit"
        disabled={!content.trim() || pending}
        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-ink text-background disabled:opacity-40 hover:bg-primary transition-colors shrink-0"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}
