import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { workspaceMembers } from "@/db/schema";
import { requireContext, type CurrentContext, type WorkspaceRole } from "@/lib/current-context";
import { PermissionError } from "@/lib/workspaces/roles";

// Role guard. Load context, verify the caller has one of the roles in
// `required`, return context for the action body to use. Throws with a
// structured error so UI layers can distinguish "not signed in" from
// "not allowed" when they catch.
//
// The membership role is re-read from the DB here rather than trusted
// from the JWT — getCurrentContext is JWT-backed for speed, but a
// demoted user's token persists until their next session refresh. One
// small index lookup on the mutation path is cheap and closes the
// elevation window. The returned ctx reflects the fresh role.
export async function assertRole(
  required: readonly WorkspaceRole[],
): Promise<CurrentContext> {
  const ctx = await requireContext();
  const [row] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, ctx.workspace.id),
        eq(workspaceMembers.userId, ctx.user.id),
      ),
    )
    .limit(1);
  const liveRole = row?.role as WorkspaceRole | undefined;
  if (!liveRole) {
    // Membership was revoked since the token was minted.
    throw new PermissionError(required, ctx.role);
  }
  if (!required.includes(liveRole)) {
    throw new PermissionError(required, liveRole);
  }
  return { ...ctx, role: liveRole };
}

// Curried wrapper for server actions. Hides the role check in one line
// at the top of the action:
//
//   export const deletePost = withRole(ROLES.ADMIN, async (ctx, id) => {
//     await db.delete(posts).where(eq(posts.id, id));
//   });
//
// The handler receives `ctx` as its first arg followed by whatever
// arguments the caller passed. `"use server"` files wrap their
// exported actions with this; pages/components call the result just
// like any other server action.
export function withRole<Args extends unknown[], R>(
  required: readonly WorkspaceRole[],
  handler: (ctx: CurrentContext, ...args: Args) => Promise<R>,
): (...args: Args) => Promise<R> {
  return async (...args: Args) => {
    const ctx = await assertRole(required);
    return handler(ctx, ...args);
  };
}
