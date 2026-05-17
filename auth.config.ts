import type { NextAuthConfig } from "next-auth";
import { env } from "@/lib/env";

// Edge/proxy-safe auth config. Must not import the Drizzle adapter,
// the db client, bcryptjs, or any OAuth provider with heavy deps —
// proxy.ts bundles this and runs on every gated navigation.
//
// The heavy jwt callback that populates user fields lives in `auth.ts`
// and runs on sign-in / unstable_update. Middleware never triggers it;
// it only decodes the existing JWT and runs `session` below.
export default {
  secret: env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/onboarding/workspace",
  },
  providers: [],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        type SemanticRole =
          | "solo"
          | "creator"
          | "team"
          | "agency"
          | "nonprofit";
        type MemberRole =
          | "owner"
          | "admin"
          | "editor"
          | "reviewer"
          | "viewer";
        const t = token as typeof token & {
          workspaceName?: string | null;
          role?: SemanticRole | null;
          timezone?: string | null;
          onboardedAt?: string | null;
          activeWorkspaceId?: string | null;
          activeWorkspaceRole?: MemberRole | null;
          activeWorkspaceName?: string | null;
          activeWorkspaceOwnerId?: string | null;
          activeWorkspaceTimezone?: string | null;
          activeWorkspaceSemanticRole?: SemanticRole | null;
          activeWorkspacePolarCustomerId?: string | null;
          activeWorkspaceFrozenAt?: string | null;
        };
        session.user.id = token.sub;
        session.user.name = (token.name as string | null) ?? null;
        session.user.email =
          (token.email as string | undefined) ?? session.user.email;
        session.user.image = (token.picture as string | null) ?? null;
        session.user.workspaceName = t.workspaceName ?? null;
        session.user.role = t.role ?? null;
        session.user.timezone = t.timezone ?? null;
        session.user.onboardedAt = t.onboardedAt
          ? new Date(t.onboardedAt)
          : null;
        session.user.activeWorkspaceId = t.activeWorkspaceId ?? null;
        session.user.activeWorkspaceRole = t.activeWorkspaceRole ?? null;
        session.user.activeWorkspaceName = t.activeWorkspaceName ?? null;
        session.user.activeWorkspaceOwnerId =
          t.activeWorkspaceOwnerId ?? null;
        session.user.activeWorkspaceTimezone =
          t.activeWorkspaceTimezone ?? null;
        session.user.activeWorkspaceSemanticRole =
          t.activeWorkspaceSemanticRole ?? null;
        session.user.activeWorkspacePolarCustomerId =
          t.activeWorkspacePolarCustomerId ?? null;
        session.user.activeWorkspaceFrozenAt = t.activeWorkspaceFrozenAt
          ? new Date(t.activeWorkspaceFrozenAt)
          : null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
