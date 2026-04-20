import type { RepeatabilityGate } from "@/lib/analytics/repeatability";
import { PROVIDER_LABELS } from "./format";

interface Props {
  gate: RepeatabilityGate;
}

export function RepeatabilityCard({ gate }: Props) {
  return (
    <section>
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Repeatability
        </p>
        <h2 className="mt-2 font-display text-[24px] lg:text-[28px] leading-[1.1] tracking-[-0.02em] text-ink">
          Pattern, or fluke?
        </h2>
      </div>

      {gate.state === "warming" ? (
        <div className="rounded-2xl border border-border border-dashed bg-background-elev p-8">
          <p className="text-[14px] text-ink/70 leading-[1.55]">
            Unlocks after {gate.weeksNeeded} weeks of history — you&apos;re at
            week {gate.weeksOfData}. Any score we printed before that would
            just be noise dressed up as insight.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-background-elev p-6">
          <div className="flex items-baseline gap-3">
            <p className="font-display text-[48px] leading-none tracking-[-0.025em] text-ink">
              {Math.round(gate.score * 100)}%
            </p>
            <p className="text-[13px] text-ink/55">
              of your top-quartile posts land in a window with another top-quartile
              post.
            </p>
          </div>

          {gate.perPlatform.length > 0 ? (
            <ul className="mt-6 space-y-2">
              {gate.perPlatform.map((p) => (
                <li
                  key={p.platform}
                  className="flex items-center justify-between text-[13px]"
                >
                  <span className="text-ink/75">
                    {PROVIDER_LABELS[p.platform] ?? p.platform}
                  </span>
                  <span className="text-ink/55 font-mono text-[12px]">
                    {Math.round(p.score * 100)}% · {p.repeatedSpikes}/
                    {p.spikeCount} spikes
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </section>
  );
}
