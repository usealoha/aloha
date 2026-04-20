import { type BestWindow, formatWindow } from "@/lib/best-time-format";
import { PROVIDER_LABELS } from "./format";

interface Props {
  windowsByPlatform: Record<string, BestWindow[]>;
}

export function BestTimesSection({ windowsByPlatform }: Props) {
  const platforms = Object.keys(windowsByPlatform);
  if (platforms.length === 0) {
    return (
      <section>
        <SectionHeading />
        <div className="rounded-2xl border border-border border-dashed bg-background-elev p-8">
          <p className="text-[14px] text-ink/70 leading-[1.55]">
            We need a little more history to surface honest windows — at least
            8 posts per channel with impressions data. Keep publishing; we&apos;ll
            flag the sweet-spots as soon as they&apos;re real.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <SectionHeading />
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {platforms.map((p) => (
          <li
            key={p}
            className="rounded-2xl border border-border bg-background-elev p-5"
          >
            <p className="text-[12px] font-semibold text-ink">
              {PROVIDER_LABELS[p] ?? p}
            </p>
            <ul className="mt-3 space-y-2">
              {windowsByPlatform[p].map((w, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-[13px]"
                >
                  <span className="text-ink">{formatWindow(w)}</span>
                  <span className="text-[11px] font-mono text-primary">
                    +{w.deltaPct}% · {w.samples} post
                    {w.samples === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SectionHeading() {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
        Best-time windows
      </p>
      <h2 className="mt-2 font-display text-[24px] lg:text-[28px] leading-[1.1] tracking-[-0.02em] text-ink">
        When your posts travel furthest.
      </h2>
    </div>
  );
}
