import type { WeekBucket } from "@/lib/analytics/summary";
import { formatCompact } from "./format";

interface Props {
  weeks: WeekBucket[];
}

export function WeeklyChart({ weeks }: Props) {
  const max = Math.max(1, ...weeks.map((w) => w.impressions));
  const total = weeks.reduce((s, w) => s + w.impressions, 0);
  const latestIdx = weeks.length - 1;

  return (
    <section className="rounded-3xl border border-border bg-background-elev p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Weekly reach · 12 weeks
          </p>
          <p className="mt-2 font-display text-[28px] leading-none tracking-[-0.02em] text-ink">
            {total > 0 ? formatCompact(total) : "No data yet"}
          </p>
        </div>
        <span className="text-[11px] text-ink/50">
          {total > 0 ? "impressions · all readback channels" : "syncing nightly"}
        </span>
      </div>

      <div className="flex items-end gap-1.5 h-[140px]">
        {weeks.map((w, i) => {
          const h = Math.max(4, Math.round((w.impressions / max) * 100));
          const isLatest = i === latestIdx;
          return (
            <div
              key={w.weekStart.toISOString()}
              className="flex-1 flex flex-col items-center gap-1.5"
              title={`${labelWeek(w.weekStart)} — ${formatCompact(w.impressions)}`}
            >
              <div
                className={`w-full rounded-t-sm ${
                  isLatest ? "bg-primary" : "bg-peach-300"
                }`}
                style={{ height: `${h}%` }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-end justify-between text-[10px] font-mono text-ink/40">
        <span>{labelWeek(weeks[0]?.weekStart)}</span>
        <span>{labelWeek(weeks[latestIdx]?.weekStart)}</span>
      </div>
    </section>
  );
}

function labelWeek(d?: Date): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(d);
}
