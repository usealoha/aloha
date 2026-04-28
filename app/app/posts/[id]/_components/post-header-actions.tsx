"use client";

import {
  CheckCircle2,
  FileText,
  Leaf,
  Loader2,
  Pencil,
  RotateCcw,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  approvePost,
  backToDraft,
  publishPostNow,
  schedulePost,
  setEvergreen,
  submitForReview,
} from "@/app/actions/posts";
import { SchedulePopover } from "@/components/schedule-popover";
import {
  availableActions,
  type ComposerAction,
} from "@/lib/posts/actions-available";
import type { PostStatus } from "@/lib/posts/transitions";
import type { WorkspaceRole } from "@/lib/current-context";
import { hasRole, ROLES } from "@/lib/workspaces/roles";
import { cn } from "@/lib/utils";
import { tzLocalInputToUtcDate } from "@/lib/tz";
import { ShareLinkButton } from "./share-link-button";

const baseBtn =
  "inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[13px] font-medium transition-colors disabled:opacity-40";
const ghostBtn = `${baseBtn} border border-border bg-background text-ink hover:border-ink/40`;
const primaryBtn = `${baseBtn} bg-ink text-background hover:bg-primary disabled:hover:bg-ink`;

export function PostHeaderActions({
  postId,
  status,
  workspaceRole,
  timezone,
  evergreenMarkedAt,
}: {
  postId: string;
  status: PostStatus;
  workspaceRole: WorkspaceRole;
  timezone: string;
  evergreenMarkedAt: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [scheduleInput, setScheduleInput] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);

  const allowed = new Set<ComposerAction>(
    availableActions(status, workspaceRole),
  );
  const canAct = (a: ComposerAction) => allowed.has(a);

  const wrap = (
    loading: string,
    success: string,
    fallbackError: string,
    run: () => Promise<unknown>,
  ) => () => {
    const toastId = toast.loading(loading);
    startTransition(async () => {
      try {
        await run();
        toast.success(success, { id: toastId });
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : fallbackError, {
          id: toastId,
        });
      }
    });
  };

  const onSubmit = wrap(
    "Submitting for review…",
    "Submitted for review.",
    "Couldn't submit for review.",
    () => submitForReview(postId),
  );
  const onBack = wrap(
    "Moving back to draft…",
    "Moved back to draft.",
    "Couldn't move back to draft.",
    () => backToDraft(postId),
  );
  const onApprove = wrap(
    "Approving…",
    "Approved.",
    "Couldn't approve.",
    () => approvePost(postId),
  );
  const onPublish = wrap(
    "Publishing…",
    "Published.",
    "Couldn't publish.",
    () => publishPostNow(postId),
  );
  const onToggleEvergreen = () => {
    const isOn = evergreenMarkedAt !== null;
    return wrap(
      isOn ? "Removing from evergreen…" : "Marking as evergreen…",
      isOn
        ? "No longer resurfacing this one."
        : "Saved for resurfacing on the recycle schedule.",
      "Couldn't update evergreen flag.",
      () => setEvergreen(postId, !isOn),
    )();
  };

  const onSchedule = () => {
    if (!scheduleInput) return;
    const when = tzLocalInputToUtcDate(scheduleInput, timezone);
    if (!when || Number.isNaN(when.getTime())) {
      toast.error("Pick a valid date and time.");
      return;
    }
    if (when.getTime() <= Date.now()) {
      toast.error("Pick a time in the future.");
      return;
    }
    const toastId = toast.loading("Scheduling…");
    startTransition(async () => {
      try {
        await schedulePost(postId, when);
        toast.success("Post scheduled.", { id: toastId });
        setShowSchedule(false);
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Couldn't schedule.",
          { id: toastId },
        );
      }
    });
  };

  const canEdit =
    status !== "published" && status !== "failed" && status !== "deleted";
  // Sharing is a reviewer-tier capability — minting a link delegates the
  // approval decision (or just visibility) to someone outside the workspace.
  // Only meaningful for posts that haven't shipped yet.
  const canShare =
    hasRole(workspaceRole, ROLES.REVIEWER) &&
    status !== "published" &&
    status !== "failed" &&
    status !== "deleted";
  // Evergreen marking is reviewer-tier and only meaningful for posts that
  // already shipped — those are the ones with audience signal worth
  // resurfacing.
  const canEvergreen =
    hasRole(workspaceRole, ROLES.REVIEWER) && status === "published";
  const isEvergreen = evergreenMarkedAt !== null;

  const hasLeftAction =
    canAct("backToDraft") ||
    canAct("submitForReview") ||
    canAct("schedule") ||
    canAct("publish") ||
    canEdit;

  return (
    <div className="flex items-center gap-2 self-start">
      {canAct("backToDraft") ? (
        <button
          type="button"
          onClick={onBack}
          disabled={pending}
          className={ghostBtn}
        >
          {pending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5" />
          )}
          Back to draft
        </button>
      ) : null}

      {canAct("submitForReview") ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={pending}
          className={primaryBtn}
        >
          {pending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileText className="w-3.5 h-3.5" />
          )}
          Submit for review
        </button>
      ) : null}

      {canAct("schedule") ? (
        <SchedulePopover
          scheduledAt={scheduleInput}
          setScheduledAt={setScheduleInput}
          open={showSchedule}
          setOpen={setShowSchedule}
          onConfirm={onSchedule}
          disabled={pending}
          busy={pending && scheduleInput !== ""}
          timezone={timezone}
        />
      ) : null}

      {canAct("publish") ? (
        <button
          type="button"
          onClick={onPublish}
          disabled={pending}
          className={primaryBtn}
        >
          {pending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          Publish
        </button>
      ) : null}

      {canEdit ? (
        <Link
          href={`/app/composer?post=${postId}`}
          className={ghostBtn}
        >
          <Pencil className="w-3.5 h-3.5" />
          {status === "draft" ? "Edit" : "Open"}
        </Link>
      ) : null}

      {canShare ? <ShareLinkButton postId={postId} /> : null}

      {canEvergreen ? (
        <button
          type="button"
          onClick={onToggleEvergreen}
          disabled={pending}
          aria-pressed={isEvergreen}
          title={
            isEvergreen
              ? "This post is queued to resurface on the recycle schedule. Click to stop."
              : "Mark as evergreen — the recycle schedule will resurface a fresh draft from this post."
          }
          className={cn(
            ghostBtn,
            isEvergreen && "border-primary/50 bg-primary-soft/40 text-ink",
          )}
        >
          {pending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Leaf className="w-3.5 h-3.5" />
          )}
          {isEvergreen ? "Evergreen" : "Mark evergreen"}
        </button>
      ) : null}

      {canAct("approve") ? (
        <>
          {hasLeftAction ? (
            <span className="h-6 w-px bg-border mx-1" aria-hidden />
          ) : null}
          <button
            type="button"
            onClick={onApprove}
            disabled={pending}
            className={cn(primaryBtn, "bg-emerald-600 hover:bg-emerald-600/90")}
          >
            {pending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            Approve
          </button>
        </>
      ) : null}
    </div>
  );
}
