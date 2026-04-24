import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, workspaceMembers, workspaces } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";

export type WorkspaceRole =
  | "owner"
  | "admin"
  | "editor"
  | "reviewer"
  | "viewer";

export type CurrentContext = {
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  workspace: {
    id: string;
    name: string;
    ownerUserId: string;
    timezone: string | null;
    role: string | null;
    polarCustomerId: string | null;
    // Set when the quota reconciler has frozen this workspace because
    // the owner is over their workspace add-on seat allowance. Frozen
    // workspaces are read-only: publish/invite mutations throw; data
    // stays visible so the owner can delete it or re-buy the seat.
    frozenAt: Date | null;
  };
  role: WorkspaceRole;
};

// Resolves the user's current tenant context in one call: user profile,
// their active workspace, and their membership role inside it. Memoized
// per-request. Does a DB lookup (unlike `getCurrentUser`, which is pure
// JWT) because the active workspace id stored on the user needs to be
// resolved into the full workspace row and validated as still a live
// membership. If later JWT claims include workspace id + role we can
// collapse this back into a token read.
//
// Returns `null` for unauthenticated or unmembered users — callers
// should treat either case as "redirect to sign-in / onboarding".
export const getCurrentContext = cache(
  async (): Promise<CurrentContext | null> => {
    const user = await getCurrentUser();
    if (!user) return null;

    const [row] = await db
      .select({
        activeWorkspaceId: users.activeWorkspaceId,
        workspaceId: workspaces.id,
        workspaceName: workspaces.name,
        ownerUserId: workspaces.ownerUserId,
        timezone: workspaces.timezone,
        workspaceRole: workspaces.role,
        polarCustomerId: workspaces.polarCustomerId,
        frozenAt: workspaces.frozenAt,
        memberRole: workspaceMembers.role,
      })
      .from(users)
      .leftJoin(workspaces, eq(workspaces.id, users.activeWorkspaceId))
      .leftJoin(
        workspaceMembers,
        and(
          eq(workspaceMembers.workspaceId, users.activeWorkspaceId),
          eq(workspaceMembers.userId, users.id),
        ),
      )
      .where(eq(users.id, user.id))
      .limit(1);

    if (!row?.workspaceId || !row.memberRole) return null;

    return {
      user,
      workspace: {
        id: row.workspaceId,
        name: row.workspaceName ?? user.workspaceName ?? "Workspace",
        ownerUserId: row.ownerUserId!,
        timezone: row.timezone ?? user.timezone ?? null,
        role: row.workspaceRole,
        polarCustomerId: row.polarCustomerId,
        frozenAt: row.frozenAt ?? null,
      },
      role: row.memberRole as WorkspaceRole,
    };
  },
);

// Guard helper for server actions — throws with a clear message when
// called outside an authenticated context. Role-aware variants land in
// Phase 4 (`assertRole`); for now any membership passes.
export async function requireContext(): Promise<CurrentContext> {
  const ctx = await getCurrentContext();
  if (!ctx) throw new Error("Unauthorized");
  return ctx;
}
