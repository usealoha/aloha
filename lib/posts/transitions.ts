// Canonical post lifecycle stages.
//
//   draft → in_review → approved → scheduled → published
//                                        ↓
//                                      failed
//
// Forward movement is strictly one stage at a time. From `approved` the
// user may branch to either `scheduled` or `published`. Backward movement
// always drops to `draft` (simpler than preserving the prior stage, and
// matches the product spec). `deleted` is a soft-delete side channel and
// can be reached from any stage.
export type PostStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "scheduled"
  | "published"
  | "failed"
  | "deleted";

const FORWARD: Record<PostStatus, PostStatus[]> = {
  draft: ["in_review"],
  in_review: ["approved"],
  approved: ["scheduled", "published"],
  scheduled: ["published", "failed"],
  published: [],
  failed: [],
  deleted: [],
};

export function canTransition(from: PostStatus, to: PostStatus): boolean {
  if (to === "deleted") return from !== "deleted";
  if (to === "draft") {
    // Backward reset from any editable non-terminal stage. Scheduled posts
    // can be unscheduled back to draft (cancel) — this is the only way to
    // take a scheduled post out of the queue short of deleting it.
    return (
      from === "in_review" || from === "approved" || from === "scheduled"
    );
  }
  return FORWARD[from]?.includes(to) ?? false;
}

export function assertTransition(from: PostStatus, to: PostStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `Invalid post transition: ${from} → ${to}. Posts move draft → in_review → approved → scheduled → published in order.`,
    );
  }
}
