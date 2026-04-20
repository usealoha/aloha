import type { ChannelRow } from "@/lib/analytics/summary";
import { formatCompact, formatDelta, PROVIDER_LABELS } from "./format";

interface Props {
  channels: ChannelRow[];
  gatedConnected: string[];
}

export function ChannelCompare({ channels, gatedConnected }: Props) {
  const hasData = channels.length > 0;

  return (
    <section>
      <div className="flex items-end justify-between gap-6 mb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Channel compare
          </p>
          <h2 className="mt-2 font-display text-[24px] lg:text-[28px] leading-[1.1] tracking-[-0.02em] text-ink">
            Which channel earns its slot?
          </h2>
        </div>
        <p className="hidden md:block text-[12.5px] text-ink/55 max-w-xs text-right">
          Reach per post, 12 weeks, with delta vs. the prior 12.
        </p>
      </div>

      {!hasData ? (
        <div className="rounded-2xl border border-border border-dashed bg-background-elev p-8 text-center">
          <p className="text-[14px] text-ink/70">
            No per-channel data yet. We sync nightly — numbers appear once
            your posts have platform metrics.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {channels.map((c) => {
            const reachPerPost =
              c.posts > 0 ? Math.round(c.impressions / c.posts) : 0;
            const delta = formatDelta(c.deltaPct);
            return (
              <li
                key={c.platform}
                className="rounded-2xl border border-border bg-background-elev p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-ink">
                    {PROVIDER_LABELS[c.platform] ?? c.platform}
                  </span>
                  <span
                    className={`text-[11px] font-mono ${
                      delta.tone === "up"
                        ? "text-primary"
                        : delta.tone === "down"
                          ? "text-ink/50"
                          : "text-ink/40"
                    }`}
                  >
                    {delta.label}
                  </span>
                </div>
                <p className="mt-4 font-display text-[32px] leading-none tracking-[-0.02em] text-ink">
                  {reachPerPost > 0 ? formatCompact(reachPerPost) : "—"}
                </p>
                <p className="mt-2 text-[11.5px] text-ink/55">
                  reach / post · {c.posts} post{c.posts === 1 ? "" : "s"}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {gatedConnected.length > 0 ? (
        <p className="mt-4 text-[12px] text-ink/55 leading-[1.55]">
          {gatedConnected
            .map((p) => PROVIDER_LABELS[p] ?? p)
            .join(", ")}{" "}
          awaiting platform approval. We&apos;ll backfill once it lands — no
          silent zeros.
        </p>
      ) : null}
    </section>
  );
}
