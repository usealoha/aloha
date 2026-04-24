"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { posts, type StudioPayload } from "@/db/schema";
import { assertRole } from "@/lib/workspaces/assert-role";
import { ROLES } from "@/lib/workspaces/roles";
import { getCapability, getForm } from "@/lib/channels/capabilities";

// Enter Studio mode for an existing draft. Seeds `studio_mode` and
// `studio_payload` if they aren't set yet, and pins `platforms` to the
// chosen channel. No-op when already in Studio for the same (channel,
// form) pair — lets scheduled reopen + accidental double-clicks coalesce.
export async function enterStudio(
  postId: string,
  channel: string,
  formId?: string,
) {
  const ctx = await assertRole(ROLES.EDITOR);

  const [post] = await db
    .select({
      id: posts.id,
      content: posts.content,
      media: posts.media,
      status: posts.status,
      studioMode: posts.studioMode,
      studioPayload: posts.studioPayload,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.workspaceId, ctx.workspace.id)))
    .limit(1);
  if (!post) throw new Error("Post not found");
  if (post.status === "published" || post.status === "deleted") {
    throw new Error("This post can no longer be edited.");
  }

  const cap = getCapability(channel);
  if (!cap) throw new Error(`Studio is not available for ${channel}.`);

  const form = formId
    ? cap.forms.find((f) => f.id === formId)
    : cap.forms[0];
  if (!form) throw new Error(`Unknown Studio form: ${formId ?? "(default)"}`);

  // Already pinned to the same form — nothing to seed.
  if (
    post.studioMode?.channel === channel &&
    post.studioMode?.form === form.id
  ) {
    return { success: true };
  }

  const payload: StudioPayload = form.hydrate({
    content: post.content,
    media: post.media ?? [],
  });

  await db
    .update(posts)
    .set({
      platforms: [channel],
      channelContent: {},
      studioMode: { channel, form: form.id },
      studioPayload: payload,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, postId));

  revalidatePath(`/app/composer/${postId}/studio`);
  return { success: true };
}

// Update the studio payload in-place while the user edits inside the
// shell. Separate from `updatePost` so we don't pay for the full
// `ComposerPayload` round-trip on every keystroke-coalesced save.
export async function saveStudioPayload(
  postId: string,
  payload: StudioPayload,
) {
  const ctx = await assertRole(ROLES.EDITOR);

  const [post] = await db
    .select({
      id: posts.id,
      status: posts.status,
      studioMode: posts.studioMode,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.workspaceId, ctx.workspace.id)))
    .limit(1);
  if (!post) throw new Error("Post not found");
  if (!post.studioMode) {
    throw new Error("Post is not in Studio mode.");
  }
  if (post.status !== "draft") {
    throw new Error(
      "Post is locked. Move it back to draft to edit its content.",
    );
  }

  await db
    .update(posts)
    .set({ studioPayload: payload, updatedAt: new Date() })
    .where(eq(posts.id, postId));

  return { success: true };
}

// Swap to a different form within the same channel. Re-hydrates from the
// current payload by routing through the outgoing form's `flatten` and the
// incoming form's `hydrate` — lossy but predictable.
export async function switchStudioForm(postId: string, nextFormId: string) {
  const ctx = await assertRole(ROLES.EDITOR);

  const [post] = await db
    .select({
      id: posts.id,
      status: posts.status,
      studioMode: posts.studioMode,
      studioPayload: posts.studioPayload,
      media: posts.media,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.workspaceId, ctx.workspace.id)))
    .limit(1);
  if (!post || !post.studioMode) {
    throw new Error("Post is not in Studio mode.");
  }
  if (post.status !== "draft") {
    throw new Error(
      "Post is locked. Move it back to draft to edit its content.",
    );
  }

  const current = getForm(post.studioMode.channel, post.studioMode.form);
  const next = getForm(post.studioMode.channel, nextFormId);
  if (!current || !next) throw new Error("Unknown Studio form.");

  const flat = current.flatten(post.studioPayload ?? {});
  const nextPayload = next.hydrate({
    content: flat.text,
    media: flat.media,
  });

  await db
    .update(posts)
    .set({
      studioMode: { channel: post.studioMode.channel, form: nextFormId },
      studioPayload: nextPayload,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, postId));

  revalidatePath(`/app/composer/${postId}/studio`);
  return { success: true };
}

// Exit Studio and return to multi-channel Compose. Flattens the structured
// payload back into the flat `content` + `media` fields, clears
// studio_*, and preserves `platforms` (still pinned to the Studio channel
// so the user can explicitly re-fanout from Compose if they want).
export async function exitStudio(postId: string) {
  const ctx = await assertRole(ROLES.EDITOR);

  const [post] = await db
    .select({
      id: posts.id,
      status: posts.status,
      studioMode: posts.studioMode,
      studioPayload: posts.studioPayload,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.workspaceId, ctx.workspace.id)))
    .limit(1);
  if (!post || !post.studioMode) {
    throw new Error("Post is not in Studio mode.");
  }
  if (post.status !== "draft") {
    throw new Error(
      "Post is locked. Move it back to draft to edit its content.",
    );
  }

  const form = getForm(post.studioMode.channel, post.studioMode.form);
  const flat = form
    ? form.flatten(post.studioPayload ?? {})
    : { text: "", media: [] };

  await db
    .update(posts)
    .set({
      content: flat.text,
      media: flat.media,
      studioMode: null,
      studioPayload: null,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, postId));

  revalidatePath("/app/dashboard");
  revalidatePath("/app/calendar");
  return { success: true };
}
