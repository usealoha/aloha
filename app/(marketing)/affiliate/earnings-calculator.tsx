"use client";

import { useState } from "react";
import { Sparkle } from "lucide-react";

// Simple per-referral economics — 30% of the first year of the matching
// plan, paid quarterly. Free-plan referrals count as 0 (they're still
// useful for list-building but the calculator reflects paid conversions).
const PLAN_REVENUE = {
  solo: 0,
  team: 192, // $16 x 12
  agency: 588, // $49 x 12
};
const COMMISSION = 0.3;

export function EarningsCalculator() {
  const [referrals, setReferrals] = useState(8);
  const [teamSplit, setTeamSplit] = useState(75); // % of paid referrals that land on Working Team
  const paidReferrals = Math.round(referrals);

  const teamRefs = Math.round((paidReferrals * teamSplit) / 100);
  const agencyRefs = paidReferrals - teamRefs;

  const firstYear =
    teamRefs * PLAN_REVENUE.team * COMMISSION +
    agencyRefs * PLAN_REVENUE.agency * COMMISSION;
  const monthly = firstYear / 12;

  return (
    <div className="rounded-3xl bg-background-elev border border-border overflow-hidden">
      <div className="p-8 lg:p-10 border-b border-border bg-peach-100">
        <div className="flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/60 mb-3">
          <Sparkle className="w-3 h-3 text-primary" />
          Earnings · rough math
        </div>
        <p className="font-display text-[36px] lg:text-[52px] leading-[1] tracking-[-0.02em]">
          ${Math.round(firstYear).toLocaleString()}
          <span className="text-[20px] lg:text-[24px] text-ink/50 font-mono ml-3">
            first-year
          </span>
        </p>
        <p className="mt-2 text-[13.5px] text-ink/70">
          ≈ ${Math.round(monthly).toLocaleString()} / month · paid quarterly
        </p>
      </div>

      <div className="p-8 lg:p-10 space-y-8">
        {/* referrals slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label
              htmlFor="referrals"
              className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55"
            >
              Paying referrals a month
            </label>
            <span className="font-display text-[22px] text-ink tracking-[-0.005em]">
              {paidReferrals}
            </span>
          </div>
          <input
            id="referrals"
            type="range"
            min={0}
            max={40}
            step={1}
            value={referrals}
            onChange={(e) => setReferrals(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between mt-2 text-[10.5px] font-mono text-ink/50">
            <span>0</span>
            <span>40</span>
          </div>
        </div>

        {/* plan split slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label
              htmlFor="split"
              className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55"
            >
              % on Working Team
            </label>
            <span className="font-display text-[22px] text-ink tracking-[-0.005em]">
              {teamSplit}%
            </span>
          </div>
          <input
            id="split"
            type="range"
            min={0}
            max={100}
            step={5}
            value={teamSplit}
            onChange={(e) => setTeamSplit(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between mt-2 text-[10.5px] font-mono text-ink/50">
            <span>0% · all Agency</span>
            <span>100% · all Team</span>
          </div>
        </div>

        {/* breakdown */}
        <div className="pt-6 border-t border-border grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-ink/55">
              Working Team
            </p>
            <p className="font-display text-[20px] tracking-[-0.005em]">
              {teamRefs} × $192
            </p>
            <p className="mt-1 text-[11.5px] text-ink/55 font-mono">
              ${Math.round(teamRefs * PLAN_REVENUE.team * COMMISSION).toLocaleString()} @ 30%
            </p>
          </div>
          <div>
            <p className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-ink/55">
              Agency
            </p>
            <p className="font-display text-[20px] tracking-[-0.005em]">
              {agencyRefs} × $588
            </p>
            <p className="mt-1 text-[11.5px] text-ink/55 font-mono">
              ${Math.round(agencyRefs * PLAN_REVENUE.agency * COMMISSION).toLocaleString()} @ 30%
            </p>
          </div>
        </div>

        <p className="pt-4 text-[11.5px] font-mono text-ink/50 leading-[1.5]">
          Assumes annual billing. Free-plan referrals don't count toward
          commission. Numbers update live as you drag.
        </p>
      </div>
    </div>
  );
}
