import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Layers,
  GraduationCap,
  LifeBuoy,
  Code2,
  Activity,
  Sparkle,
} from "lucide-react";
import { makeMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";

export const metadata = makeMetadata({
  title: "Resources — templates, docs, help",
  description:
    "The Aloha resources library. Templates, creator guides, help, API docs, status — all in one calm hub.",
  path: routes.resources.index,
});

const COLLECTIONS = [
  {
    icon: Layers,
    h: "Templates",
    p: "Starter shapes you can clone into Composer in a click — campaigns, calendars, voice presets.",
    href: routes.resources.templates,
    cta: "Browse templates",
    tone: "bg-peach-100",
  },
  {
    icon: GraduationCap,
    h: "Creator guides",
    p: "Curriculum-style learning paths. Sequenced lessons that build on each other.",
    href: routes.resources.creatorGuides,
    cta: "Start a path",
    tone: "bg-peach-300",
  },
  {
    icon: LifeBuoy,
    h: "Help center",
    p: "Search-first support. Categories, top articles, and a way to email a human.",
    href: routes.resources.helpCenter,
    cta: "Find an answer",
    tone: "bg-peach-200",
  },
  {
    icon: Code2,
    h: "API & docs",
    p: "REST API, webhooks, OAuth flows. Code samples in cURL, TypeScript, Python.",
    href: routes.resources.apiDocs,
    cta: "Read the docs",
    tone: "bg-background-elev border border-border",
  },
  {
    icon: Activity,
    h: "Status",
    p: "Live system health — coming soon. For now, write security@ if something looks off.",
    href: routes.resources.status,
    cta: "See status",
    tone: "bg-primary-soft",
  },
  {
    icon: Sparkle,
    h: "Changelog",
    p: "Every shipped feature, improvement, and fix — dated honestly, written in plain English.",
    href: routes.product.whatsNew,
    cta: "Read the changelog",
    tone: "bg-peach-200",
  },
];

export default function ResourcesHubPage() {
  return (
    <>
      {/* ─── HERO ────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-peach-200 pb-16 lg:pb-20">
        <span aria-hidden className="absolute top-[14%] left-[5%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none">✳</span>
        <span aria-hidden className="absolute top-[68%] right-[10%] font-display text-[22px] text-primary/55 rotate-[14deg] select-none">+</span>
        <span aria-hidden className="absolute top-[28%] right-[6%] font-display text-[38px] text-ink/15 rotate-[18deg] select-none">※</span>

        <div className="relative max-w-[1180px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28">
          <div className="grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-12 items-end">
            <div className="col-span-12 lg:col-span-8">
              <div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
                <span className="w-6 h-px bg-ink/40" />
                Resources
              </div>
              <h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
                Templates,
                <br />
                <span className="italic text-primary font-light">docs, help.</span>
              </h1>
              <p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
                A small, open library. Read what's useful, ignore what
                isn't. I'd rather you find the right thing than
                drip-feed you everything.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ─── COLLECTIONS BENTO ───────────────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              Six collections
            </p>
            <h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
              Pick the shape
              <br />
              <span className="italic text-primary">of what you need.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {COLLECTIONS.map((c) => (
              <Link
                key={c.h}
                href={c.href}
                className={`group ${c.tone} rounded-3xl p-7 lg:p-8 flex flex-col hover:-translate-y-1 transition-transform min-h-[220px]`}
              >
                <c.icon className="w-6 h-6 text-ink" />
                <h3 className="mt-7 font-display text-[22px] leading-[1.15] tracking-[-0.005em]">
                  {c.h}
                </h3>
                <p className="mt-3 text-[14px] text-ink/75 leading-[1.6] max-w-md">
                  {c.p}
                </p>
                <span className="mt-auto pt-6 pencil-link text-[13px] font-medium text-ink inline-flex items-center gap-2">
                  {c.cta}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NEWSLETTER NUDGE ──────────────────────────────────────── */}
      <section className="py-20 lg:py-24 bg-background-elev">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end">
            <div className="col-span-12 lg:col-span-8">
              <h2 className="font-display text-[36px] sm:text-[48px] lg:text-[64px] leading-[1] tracking-[-0.02em]">
                Want the occasional note
                <br />
                <span className="italic text-primary">in your inbox?</span>
              </h2>
              <p className="mt-6 text-[15.5px] text-ink/70 max-w-lg leading-[1.55]">
                The newsletter launches shortly after the product does.
                Drop your email to get the first issue when it ships.
              </p>
            </div>
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:items-end">
              <Link
                href={routes.connect.newsletter}
                className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-ink text-background font-medium text-[15px] hover:bg-primary transition-colors"
              >
                Subscribe
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
