"use client";

import {
  deleteCampaignAction,
  pauseCampaignAction,
  resumeCampaignAction,
} from "@/app/actions/campaigns";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Loader2, Pause, Play, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

type DialogKind = "pause" | "delete" | null;

export function CampaignControls({
  campaignId,
  status,
}: {
  campaignId: string;
  status: string;
}) {
  const paused = status === "paused";
  const pauseable = status === "running" || status === "ready";

  const [dialog, setDialog] = useState<DialogKind>(null);
  const [isPending, startTransition] = useTransition();

  const runAction = (
    action: (fd: FormData) => Promise<void> | void,
  ) => {
    const fd = new FormData();
    fd.append("campaignId", campaignId);
    startTransition(async () => {
      try {
        await action(fd);
      } catch {
        // Server actions that call `redirect` throw NEXT_REDIRECT — ignore.
        // Any real error surfaces in the server log; the UI just stays put.
      }
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {paused ? (
        <button
          type="button"
          onClick={() => runAction(resumeCampaignAction)}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-ink text-background text-[12.5px] font-medium hover:bg-primary disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-ink transition-colors"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          {isPending ? "Resuming…" : "Resume"}
        </button>
      ) : pauseable ? (
        <button
          type="button"
          onClick={() => setDialog("pause")}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-border-strong text-[12.5px] font-medium text-ink/75 hover:text-ink hover:border-ink transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Pause className="w-3.5 h-3.5" />
          Pause
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => setDialog("delete")}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-border-strong text-[12.5px] font-medium text-ink/70 hover:text-ink hover:border-ink transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </button>

      <ConfirmDialog
        isOpen={dialog === "pause"}
        onClose={() => setDialog(null)}
        onConfirm={() => runAction(pauseCampaignAction)}
        title="Pause this campaign?"
        description={
          <span className="block space-y-2">
            <span className="block">
              Every post scheduled from this campaign will be held back and
              moved to <span className="text-ink font-medium">Drafts</span>.
              Nothing else on your calendar is affected.
            </span>
            <span className="block text-ink/55">
              You can resume any time — Aloha will put the held posts back on
              their original times, skipping any that have already passed.
            </span>
          </span>
        }
        confirmText="Pause campaign"
        cancelText="Keep running"
        variant="default"
      />

      <ConfirmDialog
        isOpen={dialog === "delete"}
        onClose={() => setDialog(null)}
        onConfirm={() => runAction(deleteCampaignAction)}
        title="Delete this campaign?"
        description={
          <span className="block space-y-2">
            <span className="block">
              This removes the campaign and deletes every{" "}
              <span className="text-ink font-medium">draft</span>,{" "}
              <span className="text-ink font-medium">scheduled</span>, and{" "}
              <span className="text-ink font-medium">failed</span> post tied to
              it. Scheduled posts will not publish.
            </span>
            <span className="block text-ink/55">
              Already-published posts stay — deleting a campaign doesn&apos;t
              touch what&apos;s already live. This can&apos;t be undone.
            </span>
          </span>
        }
        confirmText="Delete campaign"
        cancelText="Keep"
        variant="destructive"
      />
    </div>
  );
}
