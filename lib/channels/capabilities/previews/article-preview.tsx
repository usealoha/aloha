"use client";

import type { FormPreviewProps } from "@/lib/channels/capabilities/types";
import { readArticlePayload } from "../editors/article-editor";

export function makeArticlePreview(channel: string) {
  return function ArticlePreview({ payload, profile, author }: FormPreviewProps) {
    const { title, body, media } = readArticlePayload(payload);
    const displayName = profile?.displayName ?? author.name;
    const handle = profile?.handle ?? "";
    const cover = media.find((m) => m.mimeType.startsWith("image/"));
    return (
      <article className="w-full max-w-[680px] rounded-2xl border border-border bg-background-elev overflow-hidden">
        {cover ? (
          <div className="w-full aspect-[16/7] bg-background">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover.url}
              alt={cover.alt ?? ""}
              className="w-full h-full object-cover"
            />
          </div>
        ) : null}
        <div className="px-6 py-5 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            {channel}
          </p>
          <h2 className="font-display text-[26px] leading-[1.2] text-ink break-words">
            {title || "Untitled"}
          </h2>
          <div className="text-[12px] text-ink/55">
            {displayName}
            {handle ? ` · ${handle}` : ""}
          </div>
          <div className="pt-2 text-[14.5px] leading-[1.6] text-ink whitespace-pre-wrap break-words">
            {body || (
              <span className="italic text-ink/35">
                Your article body will appear here.
              </span>
            )}
          </div>
        </div>
      </article>
    );
  };
}
