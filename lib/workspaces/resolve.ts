import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

// Resolves a user's current workspace id. Used by worker/background paths
// that only have a userId in hand (publishers, sync jobs, cron). Returns
// `null` when the user has no active workspace set — rare post-backfill,
// but possible for a brand-new signup that hasn't finished onboarding.
// Inserts into tenant tables with NOT NULL workspaceId should use
// `requireActiveWorkspaceId` instead so they fail loudly rather than
// silently drop data.
export async function resolveActiveWorkspaceId(
  userId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ workspaceId: users.activeWorkspaceId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.workspaceId ?? null;
}

export async function requireActiveWorkspaceId(
  userId: string,
): Promise<string> {
  const workspaceId = await resolveActiveWorkspaceId(userId);
  if (!workspaceId) {
    throw new Error(
      `User ${userId} has no active workspace. Run the backfill script or finish onboarding.`,
    );
  }
  return workspaceId;
}
