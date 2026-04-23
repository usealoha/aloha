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
        const t = token as typeof token & {
          workspaceName?: string | null;
          role?: "solo" | "creator" | "team" | "agency" | "nonprofit" | null;
          timezone?: string | null;
          onboardedAt?: string | null;
          activeWorkspaceId?: string | null;
          activeWorkspaceRole?:
            | "owner"
            | "admin"
            | "editor"
            | "reviewer"
            | "viewer"
            | null;
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
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
