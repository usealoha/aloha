import "server-only";

// Helpers shared by post-lifecycle handlers (publish_post, save_as_draft,
// approval_status). Each step upstream of these returns `{ postId, ... }`
// in its output and it lands in `snapshot` keyed by step id. We scan the
// snapshot values for the most recent postId so handlers don't need to
// hardcode which upstream step produced it.

export function findPostIdInSnapshot(
  snapshot: Record<string, unknown>,
  trigger: Record<string, unknown>,
): string | null {
  // Trigger takes precedence — a `post_published` trigger, for example,
  // already carries the post id and that's authoritative.
  if (typeof trigger.postId === "string" && trigger.postId.length > 0) {
    return trigger.postId;
  }
  // Walk snapshot entries in insertion order (which matches step execution
  // order) and return the latest postId found.
  let found: string | null = null;
  for (const value of Object.values(snapshot)) {
    if (value && typeof value === "object" && "postId" in value) {
      const id = (value as { postId?: unknown }).postId;
      if (typeof id === "string" && id.length > 0) found = id;
    }
  }
  return found;
}
