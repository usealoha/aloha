import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  FileText,
  ListChecks,
  GraduationCap,
  Layers,
  LifeBuoy,
  Code2,
  Activity,
  Sparkle,
} from "lucide-react";
import { makeMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { FIELD_NOTES } from "@/lib/field-notes";

export const metadata = makeMetadata({
  title: "Resources — essays, playbooks, templates, docs",
  description:
    "The Aloha resources library. Field notes, playbooks, templates, creator guides, help, API docs, status — all in one calm hub.",
  path: routes.resources.index,
});

const COLLECTIONS = [
  {
    icon: FileText,
    h: "Field notes",
    p: "Essays from the team. Product craft, creator economy, the quiet shape of good tools.",
    href: routes.resources.fieldNotes,
    cta: "Read essays",
    tone: "bg-peach-200",
    span: "lg:col-span-2",
  },
  {
    icon: ListChecks,
    h: "Playbooks",
    p: "Tactical guides — five-minute setups, multi-week campaigns, situational runbooks.",
    href: routes.resources.playbooks,
    cta: "Open playbooks",
    tone: "bg-primary-soft",
  },
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
    tone: "bg-peach-100",
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
    p: "Live system health across the eight networks Aloha touches. Incident history kept honest.",
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
  const featured = FIELD_NOTES[0];

  return (
    <>
      {/* ─── HERO ────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden hero-bg pb-16 lg:pb-20">
        <span aria-hidden className="absolute top-[14%] left-[5%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none">✳</span>
        <span aria-hidden className="absolute top-[68%] right-[10%] font-display text-[22px] text-primary/55 rotate-[14deg] select-none">+</span>
        <span aria-hidden className="absolute top-[28%] right-[6%] font-display text-[38px] text-ink/15 rotate-[18deg] select-none">※</span>

        <div className="relative max-w-[1180px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28">
          <div className="grid grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="col-span-12 lg:col-span-8">
              <div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
                <span className="w-6 h-px bg-ink/40" />
                Resources
              </div>
              <h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
                Essays, playbooks,
                <br />
                <span className="italic text-primary font-light">templates, docs.</span>
              </h1>
              <p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
                Eight collections, all open. Read what's useful, ignore
                what isn't. We'd rather you find the right thing than
                drip-feed you everything.
              </p>
            </div>
            <div className="col-span-12 lg:col-span-4">
              <Link
                href={featured ? `${routes.resources.fieldNotes}/${featured.slug}` : routes.resources.fieldNotes}
                className={`block group rounded-3xl ${featured?.accent ?? "bg-peach-200"} p-6 hover:-translate-y-1 transition-transform`}
              >
                <p className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55 mb-3">
                  Latest field note
                </p>
                <p className="font-display text-[24px] leading-[1.15] tracking-[-0.005em] text-ink group-hover:text-primary transition-colors">
                  {featured?.title ?? "Browse the field notes"}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-mono text-ink/65 uppercase tracking-[0.14em]">
                  {featured?.readTime ?? "—"} read
                  <ArrowUpRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ─── COLLECTIONS BENTO ───────────────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              Eight collections
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
                className={`group ${c.tone} ${c.span ?? ""} rounded-3xl p-7 lg:p-8 flex flex-col hover:-translate-y-1 transition-transform min-h-[220px]`}
              >
                <c.icon className="w-6 h-6 text-ink" />
                <h3 className={`mt-7 font-display ${c.span ? "text-[28px] lg:text-[36px]" : "text-[22px]"} leading-[1.15] tracking-[-0.005em]`}>
                  {c.h}
                </h3>
                <p className={`mt-3 ${c.span ? "text-[15.5px]" : "text-[14px]"} text-ink/75 leading-[1.6] max-w-md`}>
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

      {/* ─── RECENT FIELD NOTES ─────────────────────────────────────── */}
      <section className="py-20 lg:py-24 bg-background-elev">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-10 mb-10 items-end">
            <div className="col-span-12 lg:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                Recent field notes
              </p>
              <h2 className="font-display text-[32px] lg:text-[44px] leading-[1.02] tracking-[-0.02em]">
                Latest essays
                <span className="italic text-primary"> from the team.</span>
              </h2>
            </div>
            <Link
              href={routes.resources.fieldNotes}
              className="col-span-12 lg:col-span-5 lg:text-right pencil-link inline-flex items-center gap-2 text-[14px] font-medium text-ink lg:justify-end"
            >
              See all field notes
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {FIELD_NOTES.map((n) => (
              <Link
                key={n.slug}
                href={`${routes.resources.fieldNotes}/${n.slug}`}
                className={`group block ${n.accent} rounded-3xl p-7 hover:-translate-y-1 transition-transform`}
              >
                <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink/55">
                  {n.dateLabel}
                </p>
                <p className="mt-5 font-display text-[22px] leading-[1.15] tracking-[-0.005em] text-ink">
                  {n.title}
                </p>
                <p className="mt-3 text-[13.5px] text-ink/75 leading-[1.55]">{n.lead}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-[12px] font-mono text-ink/55 uppercase tracking-[0.14em]">
                  {n.readTime} read
                  <ArrowUpRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NEWSLETTER NUDGE ──────────────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-10 items-end">
            <div className="col-span-12 lg:col-span-8">
              <h2 className="font-display text-[36px] sm:text-[48px] lg:text-[64px] leading-[1] tracking-[-0.02em]">
                Want one of these
                <br />
                <span className="italic text-primary">in your inbox?</span>
              </h2>
              <p className="mt-6 text-[15.5px] text-ink/70 max-w-lg leading-[1.55]">
                The newsletter sends one essay, what shipped, and a link
                trail every Friday. No drip, one unsubscribe link.
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
              <Link
                href={routes.connect.podcast}
                className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium text-ink"
              >
                Or listen, not read
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
