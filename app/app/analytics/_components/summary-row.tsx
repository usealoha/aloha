import { formatCompact, formatDelta } from "./format";

interface Props {
  totalImpressions: number;
  deltaPct: number | null;
  totalEngagement: number;
  postCount: number;
  prevPostCount: number;
}

export function SummaryRow({
  totalImpressions,
  deltaPct,
  totalEngagement,
  postCount,
  prevPostCount,
}: Props) {
  const postsDelta = formatDelta(
    prevPostCount === 0 ? null : Math.round(
      ((postCount - prevPostCount) / prevPostCount) * 100,
    ),
  );
  const impressionsDelta = formatDelta(deltaPct);
  const stats = [
    {
      label: "Impressions · 12w",
      value: totalImpressions > 0 ? formatCompact(totalImpressions) : "—",
      delta: impressionsDelta,
      hint: "vs. previous 12 weeks",
    },
    {
      label: "Engagement · 12w",
      value: totalEngagement > 0 ? formatCompact(totalEngagement) : "—",
      delta: null,
      hint: "likes · replies · reposts",
    },
    {
      label: "Posts with data",
      value: postCount.toString(),
      delta: postsDelta,
      hint: "readback-captured",
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-border bg-background-elev p-5"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/55">
            {s.label}
          </p>
          <p className="mt-3 font-display text-[40px] leading-none tracking-[-0.025em] text-ink">
            {s.value}
          </p>
          <div className="mt-2 flex items-center gap-2 text-[12px]">
            {s.delta ? (
              <span
                className={
                  s.delta.tone === "up"
                    ? "text-primary font-medium"
                    : s.delta.tone === "down"
                      ? "text-ink/50"
                      : "text-ink/40"
                }
              >
                {s.delta.label}
              </span>
            ) : null}
            <span className="text-ink/55">{s.hint}</span>
          </div>
        </div>
      ))}
    </section>
  );
}
