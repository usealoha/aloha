import type { PostStatus } from "./transitions";
import type { WorkspaceRole } from "@/lib/current-context";
import { ROLES, hasRole } from "@/lib/workspaces/roles";

// Which composer actions are exposed for a given post status. Mirrors the
// strict-order transition matrix; the server enforces the same rules, this
// is just the UI-side allowlist so buttons hide cleanly.
//
// Content edits are locked to `draft` — later stages (in_review, approved,
// scheduled) are read-only for the body/media/channel overrides. To edit
// a post past draft, the user must Back-to-draft first (which clears the
// review audit fields).
export type ComposerAction =
  | "saveContent"
  | "saveDraft"
  | "submitForReview"
  | "approve"
  | "backToDraft"
  | "schedule"
  | "publish";

export function availableActions(
  status: PostStatus | null,
  role: WorkspaceRole | null | undefined = null,
): ComposerAction[] {
  const raw = rawActionsForStatus(status);
  // Role gates mirror the server. Drop anything the caller can't invoke.
  return raw.filter((a) => {
    switch (a) {
      case "approve":
        return hasRole(role, ROLES.REVIEWER);
      case "saveContent":
      case "saveDraft":
      case "submitForReview":
      case "backToDraft":
      case "schedule":
      case "publish":
        return hasRole(role, ROLES.EDITOR);
      default:
        return true;
    }
  });
}

function rawActionsForStatus(status: PostStatus | null): ComposerAction[] {
  // `null` = brand-new unsaved post. Only entry into the pipeline is a
  // draft; the user can save-as-draft and then advance from there.
  if (status === null) return ["saveDraft", "submitForReview"];

  switch (status) {
    case "draft":
      return ["saveContent", "submitForReview"];
    case "in_review":
      return ["approve", "backToDraft"];
    case "approved":
      return ["schedule", "publish", "backToDraft"];
    case "scheduled":
      return ["backToDraft"];
    case "published":
    case "failed":
    case "deleted":
      return [];
  }
}

// Whether the composer should accept edits to content / media / overrides
// for a post in this status. Mirrors the server rule in updatePost.
export function isEditable(status: PostStatus | null): boolean {
  return status === null || status === "draft";
}
