import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Replay is a heavy bundle (~hundreds of KB) and is only useful for
// reproducing issues inside the authenticated product. Marketing pages get
// plain error reporting without the replay recorder.
const isAppRoute =
  typeof window !== "undefined" &&
  (window.location.pathname.startsWith("/app") ||
    window.location.pathname.startsWith("/u/") ||
    window.location.pathname.startsWith("/auth"));

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    replaysOnErrorSampleRate: isAppRoute ? 1.0 : 0,
    replaysSessionSampleRate: 0,
    integrations: isAppRoute ? [Sentry.replayIntegration()] : [],
  });
}

export const onRouterTransitionStart = dsn
  ? Sentry.captureRouterTransitionStart
  : undefined;
