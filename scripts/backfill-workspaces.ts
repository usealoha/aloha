// Backfills a personal workspace for every existing user. Safe to run
// repeatedly — each pass skips users that already own a workspace and
// have `activeWorkspaceId` set.
//
// Usage:
//   bun run scripts/backfill-workspaces.ts
//
// What it does per user:
//   1. If the user already has a workspace they own with a membership row,
//      reuse it.
//   2. Otherwise create a workspace copying workspaceName/timezone/role/
//      polarCustomerId off the user, and add them as an `owner` member.
//   3. If `users.activeWorkspaceId` is null, point it at the workspace.
//
// Drops subscriptions / posts / channels onto `workspaceId` happens in
// Slice 2.3, not here. This slice only guarantees "every user has exactly
// one workspace + membership + activeWorkspaceId".

import "dotenv/config";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users, workspaceMembers, workspaces } from "@/db/schema";

async function ensureWorkspaceForUser(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      workspaceName: users.workspaceName,
      role: users.role,
      timezone: users.timezone,
      activeWorkspaceId: users.activeWorkspaceId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return { skipped: "user missing" };

  // Look for an existing workspace the user owns. Reuse it if found — this
  // keeps the script idempotent when it's run twice against the same user.
  const [existing] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.ownerUserId, user.id))
    .limit(1);

  let workspaceId = existing?.id ?? null;

  if (!workspaceId) {
    const fallbackName =
      user.workspaceName?.trim() ||
      user.name?.trim() ||
      user.email.split("@")[0] ||
      "Workspace";
    const [row] = await db
      .insert(workspaces)
      .values({
        name: fallbackName,
        ownerUserId: user.id,
        timezone: user.timezone ?? null,
        role: user.role ?? null,
      })
      .returning({ id: workspaces.id });
    workspaceId = row.id;
  }

  // Membership — composite PK makes the insert idempotent with onConflict.
  await db
    .insert(workspaceMembers)
    .values({
      workspaceId,
      userId: user.id,
      role: "owner",
    })
    .onConflictDoNothing({
      target: [workspaceMembers.workspaceId, workspaceMembers.userId],
    });

  if (!user.activeWorkspaceId) {
    await db
      .update(users)
      .set({ activeWorkspaceId: workspaceId })
      .where(eq(users.id, user.id));
  }

  return {
    workspaceId,
    created: !existing,
    setActive: !user.activeWorkspaceId,
  };
}

async function main() {
  // Pick users missing an active workspace, or missing any membership row.
  // This is cheaper than scanning every user on re-runs.
  const targets = await db
    .select({ id: users.id })
    .from(users)
    .leftJoin(workspaceMembers, eq(workspaceMembers.userId, users.id))
    .where(
      and(isNull(workspaceMembers.userId)),
    );

  // Plus anyone with a null activeWorkspaceId (they might already be a
  // member of a workspace but never had it set).
  const alsoMissingActive = await db
    .select({ id: users.id })
    .from(users)
    .where(isNull(users.activeWorkspaceId));

  const ids = Array.from(
    new Set([
      ...targets.map((r) => r.id),
      ...alsoMissingActive.map((r) => r.id),
    ]),
  );

  console.log(`Backfilling ${ids.length} user(s).`);

  let created = 0;
  let activated = 0;
  for (const id of ids) {
    const r = await ensureWorkspaceForUser(id);
    if ("created" in r && r.created) created += 1;
    if ("setActive" in r && r.setActive) activated += 1;
  }

  console.log(
    `Done. Workspaces created: ${created}. activeWorkspaceId set: ${activated}.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
