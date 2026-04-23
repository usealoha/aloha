import "server-only";
import { and, eq, ne, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import {
  postNotes,
  posts,
  users,
  workspaceMembers,
} from "@/db/schema";
import { createNotification } from "@/lib/notifications";

// Fan-out helpers for review-workflow notifications. Kept in one place
// so the server actions that fire them stay terse, and so the recipient
// logic has exactly one source of truth.

const REVIEWER_ROLES = ["owner", "admin", "reviewer"] as const satisfies readonly (
  | "owner"
  | "admin"
  | "editor"
  | "reviewer"
  | "viewer"
)[];

async function loadPostSummary(postId: string): Promise<{
  id: string;
  workspaceId: string;
  content: string;
  createdByUserId: string;
  submittedBy: string | null;
  approvedBy: string | null;
  assignedReviewerId: string | null;
} | null> {
  const [row] = await db
    .select({
      id: posts.id,
      workspaceId: posts.workspaceId,
      content: posts.content,
      createdByUserId: posts.createdByUserId,
      submittedBy: posts.submittedBy,
      approvedBy: posts.approvedBy,
      assignedReviewerId: posts.assignedReviewerId,
    })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);
  return row ?? null;
}

function preview(content: string, max = 70): string {
  const trimmed = content.trim();
  if (!trimmed) return "(empty post)";
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function postUrl(postId: string): string {
  return `/app/posts/${postId}`;
}

// Fires when a post enters `in_review`. If the post has an explicit
// assignee the notification goes only to them; otherwise it fans out to
// every reviewer+ in the workspace (skipping the submitter either way).
export async function notifyPostSubmitted(args: {
  postId: string;
  submittedBy: string;
}) {
  const post = await loadPostSummary(args.postId);
  if (!post) return;

  const [submitter] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, args.submittedBy))
    .limit(1);
  const submitterName = submitter?.name ?? "Someone";

  const recipientIds = new Set<string>();
  if (post.assignedReviewerId && post.assignedReviewerId !== args.submittedBy) {
    recipientIds.add(post.assignedReviewerId);
  } else {
    const reviewers = await db
      .select({ userId: workspaceMembers.userId })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, post.workspaceId),
          inArray(workspaceMembers.role, [...REVIEWER_ROLES]),
          ne(workspaceMembers.userId, args.submittedBy),
        ),
      );
    for (const r of reviewers) recipientIds.add(r.userId);
  }
  if (recipientIds.size === 0) return;

  await Promise.all(
    Array.from(recipientIds).map((userId) =>
      createNotification({
        userId,
        kind: "post_submitted",
        title: `${submitterName} submitted a post for review`,
        body: preview(post.content),
        url: postUrl(post.id),
        metadata: { postId: post.id, submittedBy: args.submittedBy },
      }),
    ),
  );
}

// Fires when a post's assignee changes. Pings the new assignee unless
// they assigned it to themselves (self-assignment is implicit consent).
export async function notifyPostAssigned(args: {
  postId: string;
  assignedBy: string;
  assigneeId: string;
}) {
  if (args.assigneeId === args.assignedBy) return;
  const post = await loadPostSummary(args.postId);
  if (!post) return;

  const [assigner] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, args.assignedBy))
    .limit(1);
  const assignerName = assigner?.name ?? "Someone";

  await createNotification({
    userId: args.assigneeId,
    kind: "post_assigned",
    title: `${assignerName} assigned a post to you`,
    body: preview(post.content),
    url: postUrl(post.id),
    metadata: {
      postId: post.id,
      assignedBy: args.assignedBy,
    },
  });
}

// Fires when a post is approved. Notifies the submitter (if different
// from the approver). If the post has no submitter recorded (e.g., the
// post moved straight past the submit step in some future flow), falls
// back to the post creator.
export async function notifyPostApproved(args: {
  postId: string;
  approvedBy: string;
}) {
  const post = await loadPostSummary(args.postId);
  if (!post) return;

  const recipient = post.submittedBy ?? post.createdByUserId;
  if (!recipient || recipient === args.approvedBy) return;

  const [approver] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, args.approvedBy))
    .limit(1);
  const approverName = approver?.name ?? "A reviewer";

  await createNotification({
    userId: recipient,
    kind: "post_approved",
    title: `${approverName} approved your post`,
    body: preview(post.content),
    url: postUrl(post.id),
    metadata: { postId: post.id, approvedBy: args.approvedBy },
  });
}

// Fires `post_mention` to each user tagged in a comment body. Skips
// self-mentions. Runs before notifyPostCommentAdded so the mention
// helper can tell the comment helper which userIds already got a
// stronger mention ping and should NOT also get a generic comment
// one — avoids double-notifying the same person.
export async function notifyPostMentions(args: {
  postId: string;
  authorUserId: string;
  body: string;
  mentionedUserIds: string[];
}): Promise<Set<string>> {
  const notified = new Set<string>();
  if (args.mentionedUserIds.length === 0) return notified;

  const post = await loadPostSummary(args.postId);
  if (!post) return notified;

  const [author] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, args.authorUserId))
    .limit(1);
  const authorName = author?.name ?? "Someone";

  for (const userId of args.mentionedUserIds) {
    if (userId === args.authorUserId) continue;
    notified.add(userId);
    await createNotification({
      userId,
      kind: "post_mention",
      title: `${authorName} mentioned you in a comment`,
      body: preview(args.body),
      url: postUrl(post.id),
      metadata: {
        postId: post.id,
        authorUserId: args.authorUserId,
      },
    });
  }
  return notified;
}

// Fires when someone leaves a comment on a post. Recipients: the post
// author + every earlier commenter on the same post, minus the user
// who just posted and anyone already notified via @mention. Dedupe is
// by userId.
export async function notifyPostCommentAdded(args: {
  postId: string;
  authorUserId: string;
  body: string;
  excludeUserIds?: Set<string>;
}) {
  const post = await loadPostSummary(args.postId);
  if (!post) return;

  // Prior commenters on this post (excluding the new one). LIMIT is
  // high but capped to stay safe if a thread balloons.
  const earlier = await db
    .selectDistinct({ userId: postNotes.authorUserId })
    .from(postNotes)
    .where(
      and(
        eq(postNotes.postId, args.postId),
        ne(postNotes.authorUserId, args.authorUserId),
      ),
    )
    .limit(50);

  const recipients = new Set<string>();
  if (post.createdByUserId && post.createdByUserId !== args.authorUserId) {
    recipients.add(post.createdByUserId);
  }
  for (const row of earlier) {
    if (row.userId && row.userId !== args.authorUserId) {
      recipients.add(row.userId);
    }
  }
  // Drop anyone already notified via a stronger `post_mention` — they
  // shouldn't get two pings for the same comment.
  if (args.excludeUserIds) {
    for (const id of args.excludeUserIds) recipients.delete(id);
  }
  if (recipients.size === 0) return;

  const [author] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, args.authorUserId))
    .limit(1);
  const authorName = author?.name ?? "Someone";

  await Promise.all(
    Array.from(recipients).map((userId) =>
      createNotification({
        userId,
        kind: "post_comment",
        title: `${authorName} commented on your post`,
        body: preview(args.body),
        url: postUrl(post.id),
        metadata: {
          postId: post.id,
          authorUserId: args.authorUserId,
        },
      }),
    ),
  );

  // Silence "unused" on helpers we kept for future expansion (role maps etc).
  void isNotNull;
}
