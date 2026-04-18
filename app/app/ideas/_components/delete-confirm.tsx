"use client";

import { Trash2 } from "lucide-react";
import { deleteIdeaAction } from "@/app/actions/ideas";

export function DeleteIdeaButton({ ideaId }: { ideaId: string }) {
  return (
    <form
      action={deleteIdeaAction}
      className="ml-auto"
      onSubmit={(e) => {
        // Native confirm is good enough for this destructive action —
        // avoids pulling in a dialog primitive for a one-click guard.
        if (
          !window.confirm(
            "Delete this idea? This can't be undone.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={ideaId} />
      <button
        type="submit"
        aria-label="Delete idea"
        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-ink/40 hover:text-primary-deep hover:bg-peach-100/60 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </form>
  );
}
