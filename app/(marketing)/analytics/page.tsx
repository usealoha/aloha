import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  TrendingUp,
  Download,
  MessageSquareQuote,
  Sparkle,
} from "lucide-react";
import { makeMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { ScreenshotPlaceholder } from "../_components/screenshot-placeholder";

export const metadata = makeMetadata({
  title: "Analytics — numbers that lead to the next post",
  description:
    "Aloha's analytics turn vanity metrics into useful decisions. See what's working, across every channel, with the context you'd want from a human editor.",
  path: routes.product.analytics,
});

// Fake chart bars for the hero mock — 12 bands from bg-peach-100 to peach-400.
const BARS = [28, 44, 36, 52, 40, 68, 72, 58, 80, 62, 90, 76];

export default function AnalyticsPage() {
  return (
    <>
      {/* ─── HERO ────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden hero-bg">
        <span aria-hidden className="absolute top-[12%] left-[5%] font-display text-[26px] text-ink/25 rotate-[-8deg] select-none">✳</span>
        <span aria-hidden className="absolute top-[64%] left-[10%] font-display text-[22px] text-primary/55 rotate-[14deg] select-none">+</span>
        <span aria-hidden className="absolute top-[20%] right-[7%] font-display text-[38px] text-ink/15 rotate-[18deg] select-none">※</span>
        <span aria-hidden className="absolute top-[54%] right-[4%] w-3 h-3 rounded-full border border-ink/30" />

        <div className="relative max-w-[1320px] w-full mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-24 lg:pb-32 grid grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="col-span-12 lg:col-span-7">
            <div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
              <span className="w-6 h-px bg-ink/40" />
              Analytics
            </div>

            <h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[92px]">
              Numbers that
              <br />
              <span className="italic text-primary font-light">lead to the</span>
              <br />
              next post.
            </h1>

            <p className="mt-8 max-w-[520px] text-[17px] lg:text-[18px] leading-[1.55] text-ink/70">
              Vanity metrics don't tell you what to write Monday. Aloha's
              analytics frame every number against a useful question — what
              landed, what repeated, what's worth a second shot — then tell
              you where to go next.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <Link
                href={routes.signin}
                className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-primary text-primary-foreground font-medium text-[15px] shadow-[0_8px_0_-2px_rgba(46,42,133,0.35)] hover:shadow-[0_10px_0_-2px_rgba(46,42,133,0.4)] hover:-translate-y-0.5 transition-all"
              >
                See your numbers
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#insights" className="pencil-link inline-flex items-center gap-2 text-[15px] font-medium text-ink">
                How the insights read
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-[12.5px] text-ink/60">
              <span className="inline-flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
                Historical — never truncated on plan change
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
                CSV export on every view
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
                Platform API gaps flagged, not hidden
              </span>
            </div>
          </div>

          {/* Hero visual — analytics card */}
          <div className="col-span-12 lg:col-span-5 relative">
            <div className="absolute -top-3 -right-2 z-20 rotate-[4deg] pointer-events-none">
              <div className="inline-flex items-center gap-2 bg-ink text-peach-200 px-3 py-1.5 rounded-full shadow-[0_6px_16px_-6px_rgba(23,20,18,0.5)]">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="font-display text-[12px]">+24% month</span>
              </div>
            </div>

            <div className="relative animate-[float-soft_9s_ease-in-out_infinite]">
              <div className="rounded-3xl bg-background-elev border border-border-strong shadow-[0_30px_60px_-20px_rgba(23,20,18,0.25)] overflow-hidden">
                <div className="px-5 py-3 flex items-center justify-between border-b border-border bg-muted/40">
                  <div className="flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.18em] text-ink/60">
                    engagement · 12 weeks
                  </div>
                  <span className="text-[10.5px] text-ink/50 font-mono">all channels</span>
                </div>

                {/* big stat */}
                <div className="px-6 pt-6 pb-4 border-b border-border">
                  <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-ink/50">
                    Engagement · rolling
                  </p>
                  <p className="mt-2 font-display text-[52px] leading-none tracking-[-0.02em]">
                    14,204
                  </p>
                  <p className="mt-1.5 text-[12.5px] text-ink/60">
                    <span className="text-primary font-medium">+2,760</span> vs last 12w
                  </p>
                </div>

                {/* bar chart */}
                <div className="px-6 pt-5 pb-2 flex items-end gap-1.5 h-[120px]">
                  {BARS.map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-t-sm ${
                        i === BARS.length - 2 ? "bg-primary" : "bg-peach-300"
                      }`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>

                {/* insight row */}
                <div className="mx-6 mb-6 mt-1 p-4 rounded-2xl bg-peach-100 border border-peach-300/30 flex items-start gap-3">
                  <Sparkle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <p className="text-[12.5px] leading-[1.5] text-ink/85">
                    <span className="font-semibold text-ink">Friday 9am</span> is
                    your quiet sweet-spot. Posts there get{" "}
                    <span className="font-semibold text-ink">1.8× reach</span>{" "}
                    with half the comment noise.
                  </p>
                </div>

                <div className="px-5 py-3 border-t border-border bg-muted/40 flex items-center justify-between">
                  <span className="text-[11px] text-ink/55">data through today</span>
                  <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-ink text-background text-[11.5px] font-medium">
                    <Download className="w-3 h-3" />
                    Export CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── FEATURE 1 · USEFUL INSIGHTS ─────────────────────────────── */}
      <section id="insights" className="py-24 lg:py-32">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="col-span-12 lg:col-span-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              Useful insights
            </p>
            <h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
              Context before
              <br />
              <span className="italic text-primary">the metric.</span>
            </h2>
            <p className="mt-6 text-[16px] lg:text-[17px] text-ink/75 leading-[1.6] max-w-lg">
              Every dashboard tells you impressions were up. Aloha tells you
              which three posts caused it, what they have in common, and
              whether you can reasonably repeat it. The numbers read like
              notes from a careful editor, not a scoreboard.
            </p>

            <ul className="mt-8 space-y-3 text-[14.5px] text-ink/85">
              {[
                "Best-time windows by channel, updated weekly.",
                "Repeatability score — distinguishes one-off spikes from patterns.",
                "Cohort views: new followers vs. returning, without shady pixels.",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check className="w-4 h-4 mt-[3px] text-primary shrink-0" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <ScreenshotPlaceholder
              id="insights"
              label="Insights panel — a weekly note that names the three posts that carried the lift."
              notes="Needed: screenshot of Analytics > Insights. Shows a Friday weekly-note card with 'top three' thumbnails, a repeatability badge (Likely / Lucky / One-off), and a 'copy the pattern' CTA. 5:3 crop."
              aspect="aspect-[5/3]"
              tone="bg-peach-100"
            />
          </div>
        </div>
      </section>

      {/* ─── FEATURE 2 · CHANNEL COMPARE (bento) ─────────────────────── */}
      <section className="py-24 lg:py-32 bg-background-elev">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-10 mb-14">
            <div className="col-span-12 lg:col-span-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                Channel compare
              </p>
              <h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
                Which channel
                <br />
                <span className="italic text-primary">earns its hour?</span>
              </h2>
            </div>
            <p className="col-span-12 lg:col-span-5 lg:col-start-8 text-[16px] text-ink/70 leading-[1.6] self-end">
              Compare reach per hour of work, not reach per post. You'll
              find that one channel repays 3× what it asks and another is
              a polite time-sink. Aloha just shows the math.
            </p>
          </div>

          {/* bento of mini-metrics */}
          <div className="grid grid-cols-12 gap-4 lg:gap-6">
            {[
              { n: "LinkedIn", v: "4,820", s: "reach / hour of work", delta: "+31%", tone: "bg-primary-soft", span: "lg:col-span-5" },
              { n: "Instagram", v: "2,140", s: "reach / hour of work", delta: "+8%", tone: "bg-peach-200", span: "lg:col-span-4" },
              { n: "X", v: "1,680", s: "reach / hour of work", delta: "-2%", tone: "bg-peach-100", span: "lg:col-span-3" },
              { n: "Threads", v: "1,210", s: "reach / hour of work", delta: "+44%", tone: "bg-peach-300", span: "lg:col-span-3" },
              { n: "TikTok", v: "3,540", s: "reach / hour of work", delta: "+12%", tone: "bg-peach-400", span: "lg:col-span-4" },
              { n: "YouTube", v: "6,022", s: "reach / hour of work", delta: "+19%", tone: "bg-primary-soft", span: "lg:col-span-5" },
            ].map((c) => (
              <div key={c.n} className={`col-span-12 md:col-span-6 ${c.span} ${c.tone} rounded-3xl p-6 lg:p-7 flex flex-col justify-between min-h-[160px]`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-ink">{c.n}</span>
                  <span className={`text-[10.5px] font-mono ${c.delta.startsWith("-") ? "text-ink/50" : "text-primary"}`}>
                    {c.delta}
                  </span>
                </div>
                <div>
                  <p className="font-display text-[30px] lg:text-[36px] leading-none tracking-[-0.02em]">
                    {c.v}
                  </p>
                  <p className="mt-2 text-[11.5px] text-ink/60">{c.s}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURE 3 · EXPORTS + HISTORY ──────────────────────────── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="col-span-12 lg:col-span-6 order-2 lg:order-1">
            <ScreenshotPlaceholder
              id="export"
              label="Export panel — CSV, JSON, or a Notion-friendly markdown digest."
              notes="Needed: screenshot of Analytics > Export. Three radio options (CSV / JSON / Markdown digest), date-range picker, 'include rejected posts' toggle. 4:3 crop, primary-soft bg."
              aspect="aspect-[4/3]"
              tone="bg-primary-soft"
            />
          </div>

          <div className="col-span-12 lg:col-span-6 order-1 lg:order-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              Exports &amp; history
            </p>
            <h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
              Your data,
              <br />
              <span className="italic text-primary">always yours.</span>
            </h2>
            <p className="mt-6 text-[16px] lg:text-[17px] text-ink/75 leading-[1.6] max-w-lg">
              CSV for the spreadsheet-inclined. JSON for the API-inclined.
              And a monthly digest you can paste into Notion for your team
              review. History doesn't truncate when you change plans, and
              nothing is held hostage behind an 'email us for a link'.
            </p>

            <ul className="mt-8 space-y-3 text-[14.5px] text-ink/85">
              {[
                "Full 24-month history on every plan, including Free.",
                "Platform-API gaps get a visible marker, never a silent zero.",
                "Weekly digest email — opt in, opt out, one click either way.",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check className="w-4 h-4 mt-[3px] text-primary shrink-0" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIAL ──────────────────────────────────────────────── */}
      <section className="py-24 lg:py-28">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10">
          <figure className="relative bg-primary-soft rounded-3xl p-10 lg:p-14">
            <MessageSquareQuote className="w-8 h-8 text-primary/60 mb-6" />
            <blockquote className="font-display text-[26px] lg:text-[34px] leading-[1.2] tracking-[-0.015em] max-w-3xl">
              "The analytics export alone paid for a year. My CFO agrees
              (I am the CFO)."
            </blockquote>
            <figcaption className="mt-8 flex items-center gap-4">
              <span className="w-11 h-11 rounded-full bg-ink text-background-elev font-display flex items-center justify-center">
                N
              </span>
              <div>
                <p className="font-medium">Noah C.</p>
                <p className="text-[13px] text-ink/60">Indie consultancy · 5K on LinkedIn</p>
              </div>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <div className="grid grid-cols-12 gap-10 items-end">
            <div className="col-span-12 lg:col-span-8">
              <h2 className="font-display text-[44px] sm:text-[56px] lg:text-[80px] leading-[0.98] tracking-[-0.025em]">
                Stop refreshing.
                <br />
                <span className="italic text-primary">Start answering.</span>
              </h2>
            </div>
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:items-end">
              <Link
                href={routes.signin}
                className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-ink text-background font-medium text-[15px] hover:bg-primary transition-colors"
              >
                Start free — no card
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={routes.tools.bestTimeFinder}
                className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium text-ink"
              >
                Try the free best-time finder
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
