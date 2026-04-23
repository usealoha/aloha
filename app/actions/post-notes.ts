"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { postNotes, posts, users } from "@/db/schema";
import { requireContext } from "@/lib/current-context";

export type PostNote = {
  id: string;
  postId: string;
  authorUserId: string;
  authorName: string | null;
  authorImage: string | null;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  editedAt: Date | null;
  isMine: boolean;
};

const MAX_BODY_LENGTH = 4000;

async function assertPostAccess(postId: string, workspaceId: string) {
  const [post] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.workspaceId, workspaceId)))
    .limit(1);
  if (!post) throw new Error("Post not found");
}

export async function listNotes(postId: string): Promise<PostNote[]> {
  const ctx = await requireContext();
  await assertPostAccess(postId, ctx.workspace.id);

  const rows = await db
    .select({
      id: postNotes.id,
      postId: postNotes.postId,
      authorUserId: postNotes.authorUserId,
      authorName: users.name,
      authorImage: users.image,
      body: postNotes.body,
      createdAt: postNotes.createdAt,
      updatedAt: postNotes.updatedAt,
      editedAt: postNotes.editedAt,
    })
    .from(postNotes)
    .leftJoin(users, eq(users.id, postNotes.authorUserId))
    .where(eq(postNotes.postId, postId))
    .orderBy(asc(postNotes.createdAt));

  return rows.map((row) => ({
    ...row,
    isMine: row.authorUserId === ctx.user.id,
  }));
}

export async function addNote(postId: string, body: string) {
  const ctx = await requireContext();

  const trimmed = body.trim();
  if (!trimmed) throw new Error("Comment cannot be empty");
  if (trimmed.length > MAX_BODY_LENGTH) {
    throw new Error(`Comment exceeds ${MAX_BODY_LENGTH} characters`);
  }

  await assertPostAccess(postId, ctx.workspace.id);

  const [row] = await db
    .insert(postNotes)
    .values({ postId, authorUserId: ctx.user.id, body: trimmed })
    .returning();

  revalidatePath(`/app/posts/${postId}`);
  return row;
}

export async function editNote(noteId: string, body: string) {
  const ctx = await requireContext();

  const trimmed = body.trim();
  if (!trimmed) throw new Error("Comment cannot be empty");
  if (trimmed.length > MAX_BODY_LENGTH) {
    throw new Error(`Comment exceeds ${MAX_BODY_LENGTH} characters`);
  }

  const [existing] = await db
    .select({ postId: postNotes.postId, authorUserId: postNotes.authorUserId })
    .from(postNotes)
    .where(eq(postNotes.id, noteId))
    .limit(1);
  if (!existing) throw new Error("Comment not found");
  if (existing.authorUserId !== ctx.user.id) throw new Error("Forbidden");

  const now = new Date();
  await db
    .update(postNotes)
    .set({ body: trimmed, updatedAt: now, editedAt: now })
    .where(eq(postNotes.id, noteId));

  revalidatePath(`/app/posts/${existing.postId}`);
}

export async function deleteNote(noteId: string) {
  const ctx = await requireContext();

  const [existing] = await db
    .select({ postId: postNotes.postId, authorUserId: postNotes.authorUserId })
    .from(postNotes)
    .where(eq(postNotes.id, noteId))
    .limit(1);
  if (!existing) throw new Error("Comment not found");
  if (existing.authorUserId !== ctx.user.id) throw new Error("Forbidden");

  await db.delete(postNotes).where(eq(postNotes.id, noteId));

  revalidatePath(`/app/posts/${existing.postId}`);
}

