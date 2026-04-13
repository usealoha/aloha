"use client";

import { useMemo, useState } from "react";
import { Hash, Sparkle, Search, AlertTriangle } from "lucide-react";

// Deterministic-ish synthetic numbers from the hashtag string. The point
// of the tool is the framework — volume / competition / vibe — not real
// platform data we don't have.
function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickFrom<T>(buckets: T[], seed: number): T {
  return buckets[seed % buckets.length];
}

const VIBE_BUCKETS: { vibe: string; tone: string; note: string }[] = [
  { vibe: "Discovery-friendly", tone: "bg-primary-soft text-primary border-primary/20", note: "Used by people looking, not just posting. Worth pinning to your top three." },
  { vibe: "Niche-tight", tone: "bg-peach-200 text-ink border-peach-300/40", note: "Smaller audience, higher intent. Often the best pick for portfolio posts." },
  { vibe: "Aesthetic-only", tone: "bg-peach-100 text-ink border-peach-300/30", note: "Mostly used as visual filter. Light reach, low conversion. Safe to use sparingly." },
  { vibe: "Saturated", tone: "bg-muted text-ink/70 border-border", note: "High volume, faceless. Your post will sit between strangers' for ten seconds." },
  { vibe: "Branded — be careful", tone: "bg-peach-300 text-ink border-peach-400/40", note: "Owned by another brand or campaign. Don't appropriate without context." },
  { vibe: "Algorithm-flagged", tone: "bg-ink text-peach-200 border-ink", note: "Risk of soft suppression. Use only if your post is unambiguously about this topic." },
];

const SHADOWBAN_TOKENS = new Set([
  "follow4follow",
  "f4f",
  "l4l",
  "instafollow",
  "tagsforlikes",
  "likeforlike",
  "dm",
  "snapchat",
  "freefollowers",
]);

function decode(raw: string) {
  const trimmed = raw.replace(/^#/, "").trim().toLowerCase();
  if (!trimmed) return null;

  const seed = hash32(trimmed);

  // Volume — log-distributed across 12K to 18M.
  const volRaw = 12000 * Math.pow(1.6, seed % 22);
  const volume = Math.min(18_000_000, Math.round(volRaw));

  // Competition — 1–95.
  const competition = (seed % 95) + 1;

  // Last-30-day delta — between -22% and +48%.
  const trend = ((seed >> 7) % 70) - 22;

  const vibe = pickFrom(VIBE_BUCKETS, (seed >> 11) % VIBE_BUCKETS.length);

  const flagged = SHADOWBAN_TOKENS.has(trimmed);

  // Suggested companions — three deterministic siblings.
  const suffixes = ["weekly", "diary", "field", "studio", "ritual", "minimal", "monday", "evening"];
  const companions = [0, 1, 2].map((i) => {
    const root = trimmed.replace(/[0-9]/g, "");
    return `#${root}${suffixes[(seed >> (i * 3)) % suffixes.length]}`;
  });

  return { tag: `#${trimmed}`, volume, competition, trend, vibe, flagged, companions };
}

function formatVolume(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

export function HashtagDecoder() {
  const [input, setInput] = useState("slowdesign");
  const result = useMemo(() => decode(input), [input]);

  return (
    <div className="grid grid-cols-12 gap-6 lg:gap-8">
      {/* form */}
      <div className="col-span-12 lg:col-span-5">
        <div className="p-7 lg:p-8 rounded-3xl bg-peach-100 border border-peach-300/40 space-y-6">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Decode any hashtag
          </p>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-2">
              Hashtag
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="slowdesign"
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-ink/10">
            <p className="text-[11.5px] text-ink/60 leading-[1.6]">
              Numbers below are illustrative — we don't have live
              platform-API access. The framework (volume / competition /
              vibe / shadowban flag) is what matters: it's the same one
              we use inside the product.
            </p>
          </div>
        </div>
      </div>

      {/* result */}
      <div className="col-span-12 lg:col-span-7 space-y-4">
        {!result ? (
          <div className="p-10 rounded-3xl bg-background-elev border border-border text-center text-[14px] text-ink/55">
            Type a hashtag to decode it.
          </div>
        ) : (
          <>
            <div className="rounded-3xl bg-background-elev border border-border p-7 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <p className="font-display text-[28px] tracking-[-0.01em] text-ink">
                  {result.tag}
                </p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10.5px] font-semibold uppercase tracking-[0.14em] ${result.vibe.tone}`}>
                  <Sparkle className="w-3 h-3" />
                  {result.vibe.vibe}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-ink/55">
                    Posts using it
                  </p>
                  <p className="mt-2 font-display text-[28px] leading-none tracking-[-0.015em]">
                    {formatVolume(result.volume)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-ink/55">
                    Competition
                  </p>
                  <p className="mt-2 font-display text-[28px] leading-none tracking-[-0.015em]">
                    {result.competition}/100
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-ink/55">
                    30-day trend
                  </p>
                  <p className={`mt-2 font-display text-[28px] leading-none tracking-[-0.015em] ${result.trend >= 0 ? "text-primary" : "text-ink/60"}`}>
                    {result.trend >= 0 ? "+" : ""}
                    {result.trend}%
                  </p>
                </div>
              </div>

              <p className="mt-6 pt-6 border-t border-border text-[13.5px] text-ink/75 leading-[1.6]">
                {result.vibe.note}
              </p>
            </div>

            {result.flagged && (
              <div className="p-5 rounded-2xl bg-ink text-background-elev flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-peach-300 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-peach-200">
                    Shadowban risk
                  </p>
                  <p className="text-[13px] text-background-elev/80 leading-[1.55]">
                    This tag is on multiple platforms' soft-suppression
                    lists. It will not earn what it looks like it should.
                  </p>
                </div>
              </div>
            )}

            <div className="p-7 rounded-3xl bg-peach-200">
              <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                <Search className="w-3.5 h-3.5 text-ink/60" />
                Companions worth trying
              </div>
              <ul className="flex flex-wrap gap-2">
                {result.companions.map((c) => (
                  <li key={c}>
                    <button
                      type="button"
                      onClick={() => setInput(c.replace("#", ""))}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background-elev/70 border border-ink/10 text-[12.5px] text-ink hover:bg-background-elev transition-colors"
                    >
                      {c}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[12px] text-ink/65 leading-[1.55]">
                Click any companion to decode it — same model, same caveats.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
