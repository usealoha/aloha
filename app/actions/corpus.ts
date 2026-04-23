"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { brandCorpus } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { getCurrentContext } from "@/lib/current-context";
import { assertRole, ROLES } from "@/lib/workspaces/roles";
import { disconnectNotion, syncNotionCorpus } from "@/lib/notion";
import { requireMuseAccess } from "@/lib/billing/muse";

// Void return so this is usable as a server-action `form action`. Detailed
// sync stats land in `ai_jobs` once the sync uses the job queue; for now
// they're visible in the console.
export async function syncNotionAction() {
  const ctx = await assertRole(ROLES.ADMIN);
  const user = ctx.user;
  await requireMuseAccess(user.id);
  const result = await syncNotionCorpus(user.id);
  console.log("[notion] sync result", result);
  revalidatePath("/app/settings/muse");
}

export async function disconnectNotionAction() {
  const ctx = await assertRole(ROLES.ADMIN);
  const user = ctx.user;
  const { workspace } = ctx;
  await requireMuseAccess(user.id);
  await disconnectNotion(user.id);
  // Also purge corpus rows sourced from Notion; they're stale now.
  await db
    .delete(brandCorpus)
    .where(
      and(eq(brandCorpus.workspaceId, workspace.id), eq(brandCorpus.source, "notion")),
    );
  revalidatePath("/app/settings/muse");
}
