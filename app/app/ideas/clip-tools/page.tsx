// "Capture from anywhere" tools — currently just the browser bookmarklet.
// The email-to-ideas surface is gated behind INBOUND_EMAIL_DOMAIN /
// INBOUND_EMAIL_SECRET; until both are set the section is hidden so
// users don't see a half-built feature. Setting both env vars
// re-enables it without code changes.

import { BookmarkletButton } from "./_components/bookmarklet-button";
import { CopyText } from "./_components/copy-text";
import { ensureWorkspaceShortId } from "@/lib/workspaces/short-id";
import { getCurrentContext } from "@/lib/current-context";
import { env } from "@/lib/env";
import { redirect } from "next/navigation";
import { Bookmark, Inbox } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClipToolsPage() {
  const ctx = await getCurrentContext();
  if (!ctx) redirect("/auth/sign-in");

  const inboundDomain = env.INBOUND_EMAIL_DOMAIN ?? null;
  const inboundEnabled = Boolean(inboundDomain && env.INBOUND_EMAIL_SECRET);
  // Only spend the (potentially DB-mutating) shortId roundtrip when the
  // email surface is actually going to render.
  const alias = inboundEnabled
    ? `ideas-${await ensureWorkspaceShortId(ctx.workspace.id)}@${inboundDomain}`
    : null;

  // The bookmarklet is a single-line javascript: URL the user drags to
  // their bookmarks bar. We construct it server-side so APP_URL is
  // baked in and there's no client-side env juggling.
  const appUrl = env.APP_URL.replace(/\/$/, "");
  const bookmarklet =
    `javascript:(function(){` +
    `var s=window.getSelection&&window.getSelection().toString()||'';` +
    `var u='${appUrl}/api/ideas/clip?url='+encodeURIComponent(location.href)+` +
    `'&title='+encodeURIComponent(document.title)+` +
    `'&selection='+encodeURIComponent(s);` +
    `window.open(u,'_blank','noopener,noreferrer');` +
    `})();void(0);`;

  return (
    <div className="max-w-3xl space-y-10">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Capture from anywhere
        </p>
        <h1 className="mt-2 font-display text-[28px] leading-[1.1] tracking-[-0.02em] text-ink">
          Ideas don&apos;t have to start in the app.
        </h1>
        <p className="mt-2 text-[13.5px] text-ink/65 leading-[1.55] max-w-2xl">
          {alias
            ? "Forward an email, drag a bookmarklet, or grab a quote from any page."
            : "Drag a bookmarklet to your bar and grab a quote from any page."}{" "}
          We&apos;ll file it under{" "}
          <strong className="text-ink/80 font-medium">{ctx.workspace.name}</strong>{" "}
          and you can promote it to a draft when you&apos;re ready to write.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-background-elev p-6 space-y-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          <Bookmark className="w-3.5 h-3.5" />
          Browser bookmarklet
        </div>
        <p className="text-[13.5px] text-ink leading-[1.55]">
          Drag this button to your bookmarks bar. Click it on any page to
          file the URL (and any selected text) as an idea.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <BookmarkletButton href={bookmarklet} />
          <p className="text-[11.5px] text-ink/55">
            Drag it up to your bookmarks bar. Doesn&apos;t work? Use the
            link below to add it manually.
          </p>
        </div>
        <details className="text-[12px] text-ink/65">
          <summary className="cursor-pointer text-ink/75 hover:text-ink">
            Add manually
          </summary>
          <p className="mt-2">
            Right-click your bookmarks bar → Add bookmark / Add page. Use
            any name (we suggest <em>Save to Aloha</em>) and paste the URL
            below as the address.
          </p>
          <div className="mt-2">
            <CopyText value={bookmarklet} />
          </div>
        </details>
      </section>

      {alias ? (
        <section className="rounded-2xl border border-border bg-background-elev p-6 space-y-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            <Inbox className="w-3.5 h-3.5" />
            Email-to-ideas
          </div>
          <p className="text-[13.5px] text-ink leading-[1.55]">
            Forward any email to your workspace alias and we&apos;ll file
            it as an idea. The subject becomes the title; the body becomes
            the idea text.
          </p>
          <CopyText value={alias} />
          <p className="text-[11.5px] text-ink/55 leading-[1.55]">
            Send from the address you logged in with so the idea is
            attributed to you. Forwards from other addresses still land in
            the workspace, just credited to the workspace owner.
          </p>
        </section>
      ) : null}
    </div>
  );
}
