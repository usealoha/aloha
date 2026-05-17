import { cache } from "react";
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
    //
    // NOTE: This value comes from the JWT. The quota reconciler is
    // triggered by Polar webhooks and by seat/workspace mutations made
    // by *other* members — none of those have the affected user's
    // session, so unstable_update can't refresh their token. The
    // render-side banner can therefore lag until the user's next sign-in
    // or unstable_update. Mutation guards that need authoritative freeze
    // state must re-check the DB.
    frozenAt: Date | null;
  };
  role: WorkspaceRole;
};

// Pure JWT read. The active workspace row + membership role are stashed
// into the token by auth.ts:loadUserJwtFields on sign-in and on every
// unstable_update, so this resolves to no DB calls per request. Memoized
// per-request via React `cache()` so repeated calls within one render
// pass are free.
//
// Returns `null` when:
//   - the user isn't signed in,
//   - the JWT predates the active-workspace fields (will be refreshed on
//     the next request by the backfill branch of the jwt callback), or
//   - the user has no active workspace or no membership in it.
// Callers should treat any null as "redirect to sign-in / onboarding".
export const getCurrentContext = cache(
  async (): Promise<CurrentContext | null> => {
    const user = await getCurrentUser();
    if (!user) return null;
    if (!user.activeWorkspaceId || !user.activeWorkspaceRole) return null;

    return {
      user,
      workspace: {
        id: user.activeWorkspaceId,
        name:
          user.activeWorkspaceName ?? user.workspaceName ?? "Workspace",
        // Owner id is set on the workspace row at creation and only
        // changes on ownership transfer (which calls unstable_update).
        // Non-null in practice for any usable membership.
        ownerUserId: user.activeWorkspaceOwnerId ?? user.id,
        timezone: user.activeWorkspaceTimezone ?? user.timezone ?? null,
        role: user.activeWorkspaceSemanticRole,
        polarCustomerId: user.activeWorkspacePolarCustomerId,
        frozenAt: user.activeWorkspaceFrozenAt,
      },
      role: user.activeWorkspaceRole as WorkspaceRole,
    };
  },
);

// Guard helper for server actions — throws with a clear message when
// called outside an authenticated context. For role-checked actions use
// `assertRole`, which additionally re-verifies the membership role from
// the DB so a stale JWT can't elevate permissions.
export async function requireContext(): Promise<CurrentContext> {
  const ctx = await getCurrentContext();
  if (!ctx) throw new Error("Unauthorized");
  return ctx;
}
