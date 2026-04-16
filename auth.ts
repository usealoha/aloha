import NextAuth, { CredentialsSignin } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import {
  accounts,
  authenticators,
  sessions,
  users,
  verificationTokens,
} from "./db/schema";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { env } from "@/lib/env";
import Credentials from "next-auth/providers/credentials";

class EmailNotVerifiedError extends CredentialsSignin {
  code = "EmailNotVerified";
}
import GitHub from "next-auth/providers/github";
import Twitter from "next-auth/providers/twitter";
import LinkedIn from "next-auth/providers/linkedin";
import Google from "next-auth/providers/google";
import TikTok from "next-auth/providers/tiktok";
import Medium from "next-auth/providers/medium";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
    authenticatorsTable: authenticators,
  }),
  secret: env.AUTH_SECRET,
  debug: process.env.NODE_ENV !== "production",
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        const parsed = credentialsSchema.safeParse(creds);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1);

        if (!user?.passwordHash) return null;
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        if (!user.emailVerified) {
          throw new EmailNotVerifiedError();
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
    GitHub({
      clientId: env.AUTH_GITHUB_ID,
      clientSecret: env.AUTH_GITHUB_SECRET,
    }),
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
    Twitter({
      clientId: env.AUTH_TWITTER_ID,
      clientSecret: env.AUTH_TWITTER_SECRET,
      authorization: {
        url: "https://x.com/i/oauth2/authorize",
        params: {
          scope:
            "tweet.read tweet.write users.read media.write offline.access",
        },
      },
    }),
    LinkedIn({
      clientId: env.AUTH_LINKEDIN_ID,
      clientSecret: env.AUTH_LINKEDIN_SECRET,
      authorization: {
        params: { scope: "openid profile email w_member_social" },
      },
    }),
    {
      id: "facebook",
      name: "Facebook",
      type: "oauth",
      checks: ["state"],
      authorization: {
        url: "https://www.facebook.com/v22.0/dialog/oauth",
        params: {
          scope: "public_profile,email",
        },
      },
      token: "https://graph.facebook.com/v22.0/oauth/access_token",
      userinfo: "https://graph.facebook.com/v22.0/me?fields=id,name,email,picture",
      async profile(profile: {
        id: string;
        name: string;
        email?: string;
        picture?: { data?: { url?: string } };
      }) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email ?? null,
          image: profile.picture?.data?.url ?? null,
        };
      },
      clientId: env.AUTH_FACEBOOK_ID,
      clientSecret: env.AUTH_FACEBOOK_SECRET,
    },
    {
      id: "instagram",
      name: "Instagram",
      type: "oauth",
      authorization: {
        url: "https://api.instagram.com/oauth/authorize",
        params: {
          scope:
            "instagram_business_basic,instagram_business_content_publish,instagram_business_manage_comments",
        },
      },
      token: "https://api.instagram.com/oauth/access_token",
      userinfo:
        "https://graph.instagram.com/v22.0/me?fields=user_id,username,name,profile_picture_url",
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
      async profile(profile: {
        user_id: string;
        username: string;
        name?: string;
        profile_picture_url?: string;
      }) {
        return {
          id: profile.user_id,
          name: profile.name ?? profile.username,
          email: null,
          image: profile.profile_picture_url ?? null,
        };
      },
      clientId: env.AUTH_INSTAGRAM_ID,
      clientSecret: env.AUTH_INSTAGRAM_SECRET,
    },
    {
      id: "threads",
      name: "Threads",
      type: "oauth",
      authorization: {
        url: "https://threads.net/oauth/authorize",
        params: {
          scope:
            "threads_basic,threads_content_publish,threads_manage_replies,threads_read_replies",
        },
      },
      token: "https://graph.threads.net/oauth/access_token",
      userinfo:
        "https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url",
      async profile(profile: {
        id: string;
        username: string;
        name?: string;
        threads_profile_picture_url?: string;
      }) {
        return {
          id: profile.id,
          name: profile.name ?? profile.username,
          email: null,
          image: profile.threads_profile_picture_url ?? null,
        };
      },
      clientId: env.AUTH_THREADS_ID,
      clientSecret: env.AUTH_THREADS_SECRET,
    },
    TikTok({
      clientId: env.AUTH_TIKTOK_ID,
      clientSecret: env.AUTH_TIKTOK_SECRET,
    }),
    Medium({
      clientId: env.AUTH_MEDIUM_ID!,
      clientSecret: env.AUTH_MEDIUM_SECRET!,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/onboarding/workspace",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  events: {
    // When a user re-links an OAuth account (used by Aloha to "reconnect"
    // a channel after token expiry), clear any stale reauth flag — fresh
    // tokens have just been written by the adapter.
    async linkAccount({ user, account }) {
      if (!user.id || !account.provider) return;
      await db
        .update(accounts)
        .set({ reauthRequired: false })
        .where(
          and(
            eq(accounts.userId, user.id),
            eq(accounts.provider, account.provider),
          ),
        );

      // Instagram and Threads return short-lived tokens (~1 hr) from OAuth.
      // Exchange for long-lived tokens (~60 days) immediately.
      if (account.provider === "instagram" && account.access_token) {
        try {
          const res = await fetch(
            `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${env.AUTH_INSTAGRAM_SECRET}&access_token=${account.access_token}`,
          );
          if (res.ok) {
            const json = (await res.json()) as {
              access_token: string;
              expires_in: number;
            };
            await db
              .update(accounts)
              .set({
                access_token: json.access_token,
                expires_at: Math.floor(Date.now() / 1000) + json.expires_in,
              })
              .where(
                and(
                  eq(accounts.userId, user.id),
                  eq(accounts.provider, "instagram"),
                ),
              );
          }
        } catch (err) {
          console.error("[instagram] long-lived token exchange failed", err);
        }
      }

      if (account.provider === "threads" && account.access_token) {
        try {
          const res = await fetch(
            `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${env.AUTH_THREADS_SECRET}&access_token=${account.access_token}`,
          );
          if (res.ok) {
            const json = (await res.json()) as {
              access_token: string;
              expires_in: number;
            };
            await db
              .update(accounts)
              .set({
                access_token: json.access_token,
                expires_at: Math.floor(Date.now() / 1000) + json.expires_in,
              })
              .where(
                and(
                  eq(accounts.userId, user.id),
                  eq(accounts.provider, "threads"),
                ),
              );
          }
        } catch (err) {
          console.error("[threads] long-lived token exchange failed", err);
        }
      }
    },
    async signIn({ user, account }) {
      if (!user.id || !account?.provider) return;
      await db
        .update(accounts)
        .set({ reauthRequired: false })
        .where(
          and(
            eq(accounts.userId, user.id),
            eq(accounts.provider, account.provider),
          ),
        );
    },
  },
});
