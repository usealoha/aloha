"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { ideas, type PostMedia } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { getCurrentContext } from "@/lib/current-context";
import { ROLES } from "@/lib/workspaces/roles";
import { assertRole } from "@/lib/workspaces/assert-role";
const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function parseMedia(raw: string | null): PostMedia[] | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  const clean: PostMedia[] = [];
  for (const m of parsed) {
    if (
      m &&
      typeof m === "object" &&
      typeof (m as PostMedia).url === "string" &&
      typeof (m as PostMedia).mimeType === "string" &&
      ALLOWED_MIMES.has((m as PostMedia).mimeType)
    ) {
      const item: PostMedia = {
        url: (m as PostMedia).url,
        mimeType: (m as PostMedia).mimeType,
      };
      if (typeof (m as PostMedia).alt === "string") item.alt = (m as PostMedia).alt;
      clean.push(item);
    }
    if (clean.length >= 4) break;
  }
  return clean.length > 0 ? clean : null;
}

const VALID_STATUSES = ["new", "drafted", "archived"] as const;
type IdeaStatus = (typeof VALID_STATUSES)[number];
const isStatus = (v: unknown): v is IdeaStatus =>
  typeof v === "string" && (VALID_STATUSES as readonly string[]).includes(v);

function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim().toLowerCase().replace(/^#/, ""))
    .filter(Boolean)
    .slice(0, 8);
}

export async function createIdeaAction(formData: FormData) {
  const ctx = await assertRole(ROLES.EDITOR);
  const user = ctx.user;
  const { workspace } = ctx;

  const body = String(formData.get("body") ?? "").trim();
  if (!body) throw new Error("Idea body is required.");
  const title = String(formData.get("title") ?? "").trim() || null;
  const url = String(formData.get("url") ?? "").trim() || null;
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const media = parseMedia(String(formData.get("media") ?? ""));

  await db.insert(ideas).values({
    createdByUserId: user.id,
    workspaceId: workspace.id,
    source: url ? "url_clip" : "manual",
    sourceUrl: url,
    title,
    body,
    media,
    tags,
  });
  revalidatePath("/app/ideas");
}

export async function updateIdeaAction(formData: FormData) {
  const ctx = await assertRole(ROLES.EDITOR);
  const user = ctx.user;
  const { workspace } = ctx;

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id required");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) throw new Error("Idea body is required.");
  const title = String(formData.get("title") ?? "").trim() || null;
  const url = String(formData.get("url") ?? "").trim() || null;
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const media = parseMedia(String(formData.get("media") ?? ""));

  await db
    .update(ideas)
    .set({
      title,
      body,
      sourceUrl: url,
      tags,
      media,
      updatedAt: new Date(),
    })
    .where(and(eq(ideas.id, id), eq(ideas.workspaceId, workspace.id)));
  revalidatePath("/app/ideas");
}

export async function updateIdeaStatusAction(formData: FormData) {
  const ctx = await assertRole(ROLES.EDITOR);
  const user = ctx.user;
  const { workspace } = ctx;
  const id = String(formData.get("id") ?? "");
  const statusRaw = formData.get("status");
  if (!id || !isStatus(statusRaw)) throw new Error("Invalid params");
  await db
    .update(ideas)
    .set({ status: statusRaw, updatedAt: new Date() })
    .where(and(eq(ideas.id, id), eq(ideas.workspaceId, workspace.id)));
  revalidatePath("/app/ideas");
}

export async function deleteIdeaAction(formData: FormData) {
  const ctx = await assertRole(ROLES.EDITOR);
  const user = ctx.user;
  const { workspace } = ctx;
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id required");
  await db.delete(ideas).where(and(eq(ideas.id, id), eq(ideas.workspaceId, workspace.id)));
  revalidatePath("/app/ideas");
}
