"use client";

import { useMemo, useState } from "react";
import { Check, AlertTriangle, X as XIcon, Sparkle } from "lucide-react";

type Channel = "x" | "linkedin" | "instagram" | "threads";

const CHANNEL_INFO: Record<
  Channel,
  { name: string; charSweet: [number, number]; charMax: number }
> = {
  x: { name: "X", charSweet: [80, 200], charMax: 280 },
  linkedin: { name: "LinkedIn", charSweet: [600, 1500], charMax: 3000 },
  instagram: { name: "Instagram", charSweet: [120, 400], charMax: 2200 },
  threads: { name: "Threads", charSweet: [80, 250], charMax: 500 },
};

type CheckResult = {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

const HEADER_HOOKS = /^(here(?:'s| is)|why|how|what|the (real|truth|secret)|stop|i learned|nobody (?:tells|talks)|3 ways|five ways)/i;
const QUESTION = /\?\s*$/;
const CTAs = /\b(reply|comment|share|repost|let me know|drop a|book|sign up|join|subscribe|read more|find out|click)/i;
const SHADOW_WORDS = /\b(follow ?for ?follow|f4f|l4l|tags ?for ?likes|like ?for ?like|check ?my ?bio)\b/gi;

function critique(text: string, channel: Channel): CheckResult[] {
  const t = text.trim();
  const checks: CheckResult[] = [];

  if (t.length === 0) return checks;

  // length
  const info = CHANNEL_INFO[channel];
  const [low, high] = info.charSweet;
  let lengthStatus: CheckResult["status"];
  let lengthNote: string;
  if (t.length > info.charMax) {
    lengthStatus = "fail";
    lengthNote = `${t.length} chars — over the ${info.charMax} ceiling for ${info.name}. Trim before scheduling.`;
  } else if (t.length < low) {
    lengthStatus = "warn";
    lengthNote = `${t.length} chars — under the ${low}-char sweet spot for ${info.name}. Probably too short.`;
  } else if (t.length > high) {
    lengthStatus = "warn";
    lengthNote = `${t.length} chars — past the ${high}-char sweet spot. ${info.name} readers usually drop off.`;
  } else {
    lengthStatus = "pass";
    lengthNote = `${t.length} chars — inside the ${low}-${high} sweet spot for ${info.name}.`;
  }
  checks.push({ id: "length", label: "Length", status: lengthStatus, detail: lengthNote });

  // hook
  const firstLine = t.split(/\n/)[0];
  if (HEADER_HOOKS.test(firstLine)) {
    checks.push({
      id: "hook",
      label: "Hook",
      status: "warn",
      detail: "Opens with a known formula. Recognisable but interchangeable — try a more specific first line.",
    });
  } else if (firstLine.length < 8) {
    checks.push({
      id: "hook",
      label: "Hook",
      status: "warn",
      detail: "First line is very short. Could be punchy; could be empty.",
    });
  } else {
    checks.push({
      id: "hook",
      label: "Hook",
      status: "pass",
      detail: "First line carries enough texture to read more.",
    });
  }

  // CTA / question
  if (CTAs.test(t) || QUESTION.test(t)) {
    checks.push({
      id: "cta",
      label: "Invitation to reply",
      status: "pass",
      detail: "Ends or includes an invitation — comment, question, or CTA.",
    });
  } else {
    checks.push({
      id: "cta",
      label: "Invitation to reply",
      status: "warn",
      detail: "No question or CTA. Engagement will rely entirely on the message itself.",
    });
  }

  // emoji density
  const emojiMatch = t.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) ?? [];
  const ratio = emojiMatch.length / Math.max(1, t.split(/\s+/).length);
  if (emojiMatch.length === 0) {
    checks.push({
      id: "emoji",
      label: "Emoji density",
      status: "pass",
      detail: "No emoji. Reads like a human, not a brand.",
    });
  } else if (ratio > 0.15) {
    checks.push({
      id: "emoji",
      label: "Emoji density",
      status: "warn",
      detail: `${emojiMatch.length} emoji across ${t.split(/\s+/).length} words. That's a lot — consider keeping one or two.`,
    });
  } else {
    checks.push({
      id: "emoji",
      label: "Emoji density",
      status: "pass",
      detail: `${emojiMatch.length} emoji. Restrained and on-purpose.`,
    });
  }

  // shadowban tokens
  if (SHADOW_WORDS.test(t)) {
    checks.push({
      id: "shadow",
      label: "Shadowban tokens",
      status: "fail",
      detail: "Contains text that's flagged on multiple platforms (e.g. f4f, like-for-like). Will be soft-suppressed.",
    });
  } else {
    checks.push({
      id: "shadow",
      label: "Shadowban tokens",
      status: "pass",
      detail: "Clean of obvious soft-suppression triggers.",
    });
  }

  // exclamation count
  const excl = (t.match(/!/g) ?? []).length;
  if (excl >= 4) {
    checks.push({
      id: "excl",
      label: "Exclamation marks",
      status: "warn",
      detail: `${excl} exclamation marks. The post is screaming. Consider one, max.`,
    });
  } else {
    checks.push({
      id: "excl",
      label: "Exclamation marks",
      status: "pass",
      detail: `${excl} — restrained.`,
    });
  }

  return checks;
}

const ICON: Record<CheckResult["status"], { icon: typeof Check; tone: string }> = {
  pass: { icon: Check, tone: "bg-primary-soft text-primary border-primary/20" },
  warn: { icon: AlertTriangle, tone: "bg-peach-200 text-ink border-peach-300/40" },
  fail: { icon: XIcon, tone: "bg-ink text-peach-200 border-ink" },
};

const LABEL_FOR: Record<CheckResult["status"], string> = {
  pass: "Pass",
  warn: "Worth checking",
  fail: "Fix this",
};

export function PostCritic() {
  const [text, setText] = useState(
    "Launching a product is 20% work, 80% caring enough to tell people about it the seventh time. The 7th time is when the audience you weren't sure existed finally answers.",
  );
  const [channel, setChannel] = useState<Channel>("linkedin");

  const results = useMemo(() => critique(text, channel), [text, channel]);
  const score = useMemo(() => {
    if (results.length === 0) return null;
    const weights = { pass: 1, warn: 0.5, fail: 0 };
    const sum = results.reduce((acc, r) => acc + weights[r.status], 0);
    return Math.round((sum / results.length) * 100);
  }, [results]);

  return (
    <div className="grid grid-cols-12 gap-x-0 gap-y-6 lg:gap-8">
      {/* input */}
      <div className="col-span-12 lg:col-span-5">
        <div className="p-7 lg:p-8 rounded-3xl bg-peach-100 border border-peach-300/40 space-y-6">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Paste a draft
          </p>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-2">
              Channel
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as Channel)}
              className="w-full h-12 px-4 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            >
              {(Object.keys(CHANNEL_INFO) as Channel[]).map((c) => (
                <option key={c} value={c}>
                  {CHANNEL_INFO[c].name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-2">
              Draft
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={9}
              className="w-full px-4 py-3 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none leading-[1.55]"
              placeholder="Paste a draft to critique it…"
            />
          </div>

          <p className="text-[11.5px] text-ink/60 leading-[1.55]">
            Six rules-based checks. We don't grade your taste — we grade
            the things that are easy to mess up.
          </p>
        </div>
      </div>

      {/* results */}
      <div className="col-span-12 lg:col-span-7 space-y-4">
        {results.length === 0 ? (
          <div className="p-10 rounded-3xl bg-background-elev border border-border text-center text-[14px] text-ink/55">
            Paste something to critique it.
          </div>
        ) : (
          <>
            {/* score */}
            <div className="rounded-3xl bg-ink text-background-elev p-7 lg:p-8 flex items-center justify-between">
              <div>
                <p className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-peach-200 mb-2">
                  Mechanical score
                </p>
                <p className="font-display text-[44px] leading-none tracking-[-0.02em]">
                  {score}<span className="text-[20px] text-background-elev/55 ml-1">/100</span>
                </p>
                <p className="mt-3 text-[12.5px] text-background-elev/65 max-w-sm">
                  Pure rules check. Doesn't measure whether the idea
                  is good — only whether the post mechanically lands.
                </p>
              </div>
              <Sparkle className="w-7 h-7 text-peach-300" />
            </div>

            {/* checks */}
            <div className="rounded-3xl bg-background-elev border border-border divide-y divide-border overflow-hidden">
              {results.map((r) => {
                const meta = ICON[r.status];
                const Icon = meta.icon;
                return (
                  <div key={r.id} className="p-5 lg:p-6 grid grid-cols-12 gap-x-0 gap-y-4 lg:gap-4 items-start">
                    <div className="col-span-12 md:col-span-3">
                      <p className="font-display text-[16px] leading-[1.2] text-ink">{r.label}</p>
                      <span className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-[0.14em] ${meta.tone}`}>
                        <Icon className="w-3 h-3" strokeWidth={2.5} />
                        {LABEL_FOR[r.status]}
                      </span>
                    </div>
                    <p className="col-span-12 md:col-span-9 text-[13.5px] leading-[1.6] text-ink/80">
                      {r.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
