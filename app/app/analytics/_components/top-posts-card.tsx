import Link from "next/link";
import type { TopPost } from "@/lib/analytics/summary";
import { MIN_POSTS_FOR_TOP_POSTS } from "@/lib/analytics/summary";
import { formatCompact, PROVIDER_LABELS } from "./format";

interface Props {
  topPosts: TopPost[];
  totalPostCount: number;
}

export function TopPostsCard({ topPosts, totalPostCount }: Props) {
  return (
    <section>
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Top posts · 12 weeks
        </p>
        <h2 className="mt-2 font-display text-[24px] lg:text-[28px] leading-[1.1] tracking-[-0.02em] text-ink">
          What carried the numbers.
        </h2>
      </div>

      {totalPostCount < MIN_POSTS_FOR_TOP_POSTS ? (
        <div className="rounded-2xl border border-border border-dashed bg-background-elev p-8">
          <p className="text-[14px] text-ink/70 leading-[1.55]">
            Unlocks after {MIN_POSTS_FOR_TOP_POSTS} posts with metrics — you&apos;re
            at {totalPostCount}. Ranking a shorter list would just surface
            noise, so we&apos;ll wait until the signal is there.
          </p>
        </div>
      ) : topPosts.length === 0 ? (
        <div className="rounded-2xl border border-border border-dashed bg-background-elev p-8">
          <p className="text-[14px] text-ink/70 leading-[1.55]">
            No standout posts yet in this window — platform metrics are still
            landing.
          </p>
        </div>
      ) : (
        <ol className="rounded-2xl border border-border bg-background-elev divide-y divide-border overflow-hidden">
          {topPosts.map((p, i) => (
            <li key={`${p.platform}:${p.remotePostId}`}>
              <div className="flex items-start gap-5 px-5 py-4">
                <div className="w-7 shrink-0 font-display text-[24px] leading-none text-ink/30">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14.5px] text-ink leading-normal line-clamp-2">
                    {firstLine(p.content) ??
                      "(content unavailable — posted outside Aloha)"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-ink/55">
                    <span className="inline-flex items-center h-5 px-2 rounded-full bg-peach-100 border border-border">
                      {PROVIDER_LABELS[p.platform] ?? p.platform}
                    </span>
                    {p.impressions > 0 ? (
                      <span>{formatCompact(p.impressions)} impressions</span>
                    ) : null}
                    {p.engagement > 0 ? (
                      <span>· {formatCompact(p.engagement)} engagement</span>
                    ) : null}
                  </div>
                </div>
                {p.postId ? (
                  <Link
                    href={`/app/composer?post=${p.postId}`}
                    className="pencil-link text-[12px] font-medium text-ink shrink-0 mt-1"
                  >
                    Open
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function firstLine(content: string | null): string | null {
  if (!content) return null;
  const trimmed = content.trim();
  if (!trimmed) return null;
  const line = trimmed.split(/\n/)[0].trim();
  return line.length > 180 ? `${line.slice(0, 177)}…` : line;
}
