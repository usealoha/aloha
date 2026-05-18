"use client";

import * as Sentry from "@sentry/nextjs";
import { signOut } from "next-auth/react";
import { useEffect } from "react";

// Catch-all for /app/* server errors. The common case we care about:
// the JWT has a stale activeWorkspaceId (or membership) that no longer
// matches the DB, so a page deep in the tree throws "no active
// workspace" from requireActiveWorkspaceId. The layout's ctx guard
// can't see this because it only reads the JWT.
//
// Rather than show a black "client-side exception" screen, sign the
// user out (clears the stale JWT) and bounce to /auth/signin so the
// next sign-in mints a fresh token against the live DB.
const AUTH_FAILURE_PATTERNS = [
  /no active workspace/i,
  /unauthorized/i,
  /not signed in/i,
];

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isAuthFailure = AUTH_FAILURE_PATTERNS.some((re) =>
    re.test(error.message),
  );

  useEffect(() => {
    Sentry.captureException(error);
    if (isAuthFailure) {
      void signOut({ callbackUrl: "/auth/signin?callbackUrl=/app/dashboard" });
    }
  }, [error, isAuthFailure]);

  if (isAuthFailure) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-[14px] text-ink/60">Signing you back in…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <p className="text-[14px] text-ink/80">Something went wrong.</p>
      <button
        type="button"
        onClick={reset}
        className="text-[13px] text-primary underline underline-offset-2"
      >
        Try again
      </button>
    </div>
  );
}
