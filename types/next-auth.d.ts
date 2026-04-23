import type { DefaultSession } from "next-auth";

type UserRole = "solo" | "creator" | "team" | "agency" | "nonprofit";
type WorkspaceMemberRole =
  | "owner"
  | "admin"
  | "editor"
  | "reviewer"
  | "viewer";

// Extra fields stashed in the JWT on sign-in and on unstable_update,
// so getCurrentUser() can read them without a DB round trip.
type SessionExtras = {
  id: string;
  workspaceName: string | null;
  role: UserRole | null;
  timezone: string | null;
  onboardedAt: Date | null;
  // Phase-3 workspace-scoped session. Null when the user hasn't finished
  // onboarding yet; backfilled / re-minted when the user switches.
  activeWorkspaceId: string | null;
  activeWorkspaceRole: WorkspaceMemberRole | null;
};

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & SessionExtras;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    workspaceName?: string | null;
    role?: UserRole | null;
    timezone?: string | null;
    // Serialized as ISO string in the JWT cookie.
    onboardedAt?: string | null;
    activeWorkspaceId?: string | null;
    activeWorkspaceRole?: WorkspaceMemberRole | null;
  }
}
