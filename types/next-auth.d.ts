import type { DefaultSession } from "next-auth";

type UserRole = "solo" | "creator" | "team" | "agency" | "nonprofit";

// Extra fields stashed in the JWT on sign-in and on unstable_update,
// so getCurrentUser() can read them without a DB round trip.
type SessionExtras = {
  id: string;
  workspaceName: string | null;
  role: UserRole | null;
  timezone: string | null;
  onboardedAt: Date | null;
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
  }
}
