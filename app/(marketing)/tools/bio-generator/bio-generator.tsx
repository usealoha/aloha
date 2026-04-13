"use client";

import { useState, useMemo } from "react";
import { Copy, Check, RotateCcw } from "lucide-react";

type Vibe = "quiet" | "punchy" | "warm";

const VIBES: { v: Vibe; label: string }[] = [
  { v: "quiet", label: "Quiet · confident" },
  { v: "punchy", label: "Punchy · short" },
  { v: "warm", label: "Warm · human" },
];

function generate(
  name: string,
  role: string,
  proof: string,
  vibe: Vibe,
): { short: string; mid: string; long: string } {
  const nm = name.trim() || "You";
  const rl = role.trim() || "writer";
  const pr = proof.trim();

  if (vibe === "punchy") {
    return {
      short: `${rl}. ${pr || "working on one thing at a time"}.`,
      mid: `${rl}. ${pr ? `${pr}.` : ""} ${nm}.`,
      long: `${nm} — ${rl.toLowerCase()}. ${pr ? `Currently: ${pr}.` : "Slowly, with care."} Not here to optimise you.`,
    };
  }

  if (vibe === "warm") {
    return {
      short: `${nm} — ${rl.toLowerCase()}, usually with coffee nearby.`,
      mid: `${rl} who ${pr ? `has been ${pr.toLowerCase()}` : "prefers the slow path"}. Say hi.`,
      long: `${nm} is a ${rl.toLowerCase()}. ${pr ? `Lately: ${pr}.` : "Writing about the quiet work."} Occasional thoughts, honest mistakes, a newsletter when it earns the send.`,
    };
  }

  // quiet default
  return {
    short: `${rl} · ${pr || "at work"}.`,
    mid: `${rl}. ${pr ? `${pr}.` : ""} Writing for people doing the thing, not talking about the thing.`,
    long: `${nm}. ${rl} ${pr ? `— ${pr}` : ""}. I write about the work behind the work. Short essays, useful templates, occasional long reads. No growth-tactic dispatches.`,
  };
}

export function BioGenerator() {
  const [name, setName] = useState("Ainslee Dunn");
  const [role, setRole] = useState("Studio owner + slow designer");
  const [proof, setProof] = useState("running a design studio in Brooklyn");
  const [vibe, setVibe] = useState<Vibe>("quiet");
  const [copied, setCopied] = useState<string | null>(null);

  const bios = useMemo(() => generate(name, role, proof, vibe), [name, role, proof, vibe]);

  const copy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1200);
  };

  const reset = () => {
    setName("");
    setRole("");
    setProof("");
    setVibe("quiet");
  };

  return (
    <div className="grid grid-cols-12 gap-6 lg:gap-8">
      {/* form */}
      <div className="col-span-12 lg:col-span-5">
        <div className="p-7 lg:p-8 rounded-3xl bg-peach-100 border border-peach-300/40 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55">
              Tell us about you
            </p>
            <button
              type="button"
              onClick={reset}
              className="pencil-link inline-flex items-center gap-1.5 text-[11.5px] text-ink/60"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-2">
              Your name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ainslee Dunn"
              className="w-full h-12 px-4 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-2">
              What you do
            </label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Newsletter writer, freelance designer…"
              className="w-full h-12 px-4 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-2">
              One concrete detail <span className="text-ink/40 font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <input
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              placeholder="e.g. running a studio in Brooklyn"
              className="w-full h-12 px-4 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-3">
              Vibe
            </label>
            <div className="flex flex-wrap gap-2">
              {VIBES.map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setVibe(opt.v)}
                  className={`h-10 px-4 rounded-full text-[12.5px] font-medium transition-colors ${
                    vibe === opt.v
                      ? "bg-ink text-background"
                      : "bg-background-elev text-ink border border-border-strong hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* results */}
      <div className="col-span-12 lg:col-span-7 space-y-4">
        {(["short", "mid", "long"] as const).map((key, i) => {
          const text = bios[key];
          const len = text.length;
          const tone = i === 0 ? "bg-peach-200" : i === 1 ? "bg-primary-soft" : "bg-peach-300";
          const label = key === "short" ? "Short" : key === "mid" ? "Medium" : "Long";
          return (
            <article key={key} className={`p-6 lg:p-7 rounded-3xl ${tone}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55">
                  {label} · {len} chars
                </span>
                <button
                  type="button"
                  onClick={() => copy(key, text)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-background-elev/70 border border-ink/10 text-[11.5px] font-medium text-ink hover:bg-background-elev transition-colors"
                >
                  {copied === key ? (
                    <>
                      <Check className="w-3 h-3 text-primary" strokeWidth={2.5} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-[15px] lg:text-[15.5px] leading-[1.55] text-ink">{text}</p>
            </article>
          );
        })}

        <p className="text-[12px] font-mono text-ink/55 pt-2">
          Generated locally in your browser. Nothing is sent anywhere. If
          a draft reads too generic, try a more specific detail — the
          generator leans on it heavily.
        </p>
      </div>
    </div>
  );
}
