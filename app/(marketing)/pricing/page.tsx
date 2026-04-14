import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Flame,
  Leaf,
  Minus,
  Smile,
  Sparkle,
} from "lucide-react";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  faqJsonLd,
  makeMetadata,
} from "@/lib/seo";
import { JsonLd } from "@/lib/json-ld";
import { routes } from "@/lib/routes";

export const metadata = makeMetadata({
  title: "Pricing — three plans, one honest price",
  description:
    "Aloha pricing: Solo creator (free forever), Working team ($16/mo), Agency ($49/mo). Everything included, no trial timers, no per-channel tax. 40% off for nonprofits, students, and OSS.",
  path: routes.pricing,
});

type Tier = {
  slug: "solo" | "team" | "agency";
  name: string;
  Icon: typeof Smile;
  tagline: string;
  desc: string;
  priceLine: string;
  priceValue: string;
  priceCurrency: string;
  priceSub: string;
  cta: string;
  ctaHref: string;
  features: string[];
  accent: string;
  featured?: boolean;
};

const TIERS: Tier[] = [
  {
    slug: "solo",
    name: "Solo creator",
    Icon: Smile,
    tagline: "Everything personal",
    desc: "Link-in-bio, a smart queue, AI that learns your voice, and the calendar view that fits a one-human team.",
    priceLine: "Free forever",
    priceValue: "0",
    priceCurrency: "USD",
    priceSub: "no card, no expiry",
    cta: "Get going",
    ctaHref: routes.signup,
    features: [
      "3 channels",
      "10 posts / channel / month",
      "Unlimited drafts",
      "Voice model (tuned on your 12 best posts)",
      "Link-in-bio + 1 landing page",
      "Weekly nudges",
      "Community support",
    ],
    accent: "bg-peach-100",
  },
  {
    slug: "team",
    name: "Working team",
    Icon: Leaf,
    tagline: "Ship without stepping on toes",
    desc: "Roles, approvals, a shared voice, and brand kits so a junior hire can write as confidently as the founder.",
    priceLine: "$16 / month",
    priceValue: "16",
    priceCurrency: "USD",
    priceSub: "billed yearly · 14-day trial",
    cta: "Start free trial",
    ctaHref: routes.signup,
    features: [
      "8 channels · 3 seats included",
      "Unlimited scheduling",
      "AI Composer + shared brand voice",
      "Approval workflows + brand kits",
      "Logic Matrix automation",
      "Unified inbox (comments + DMs)",
      "Analytics dashboard + CSV export",
      "Email support",
    ],
    accent: "bg-primary-soft",
    featured: true,
  },
  {
    slug: "agency",
    name: "Agency",
    Icon: Flame,
    tagline: "Many brands, one head",
    desc: "Isolated client workspaces, white-labelled reports, and bulk scheduling for the person who runs it all.",
    priceLine: "$49 / month",
    priceValue: "49",
    priceCurrency: "USD",
    priceSub: "billed yearly · talk first",
    cta: "Talk to us",
    ctaHref: "mailto:sales@usealoha.app",
    features: [
      "Unlimited client workspaces",
      "White-labelled PDF reports",
      "Bulk scheduling across workspaces",
      "Priority + Slack support",
      "SSO (SAML) + SCIM",
      "Dedicated onboarding",
      "Audit log + role permissions",
      "Quarterly review with the team",
    ],
    accent: "bg-peach-300",
  },
];

type MatrixRow = {
  label: string;
  note?: string;
  solo: boolean | string;
  team: boolean | string;
  agency: boolean | string;
};

type MatrixSection = {
  heading: string;
  rows: MatrixRow[];
};

const MATRIX: MatrixSection[] = [
  {
    heading: "Channels + scheduling",
    rows: [
      {
        label: "Social channels",
        solo: "3",
        team: "8",
        agency: "Unlimited",
      },
      {
        label: "Scheduled posts",
        solo: "10 / channel / mo",
        team: "Unlimited",
        agency: "Unlimited",
      },
      { label: "Calendar view", solo: true, team: true, agency: true },
      { label: "Drag-to-reschedule", solo: true, team: true, agency: true },
      { label: "Best-time suggestions", solo: true, team: true, agency: true },
      { label: "Bulk schedule (CSV)", solo: false, team: true, agency: true },
    ],
  },
  {
    heading: "Writing + voice",
    rows: [
      {
        label: "Voice model",
        note: "trained on your 12 best posts",
        solo: true,
        team: true,
        agency: true,
      },
      {
        label: "Composer AI rewrites",
        solo: "20 / mo",
        team: "Unlimited",
        agency: "Unlimited",
      },
      { label: "Shared brand voice", solo: false, team: true, agency: true },
      { label: "Brand kits", solo: false, team: "3", agency: "Unlimited" },
    ],
  },
  {
    heading: "Automation + inbox",
    rows: [
      { label: "Logic Matrix (automations)", solo: false, team: true, agency: true },
      {
        label: "Unified inbox (comments + DMs)",
        solo: "read-only",
        team: true,
        agency: true,
      },
      { label: "Auto-replies + SLAs", solo: false, team: true, agency: true },
    ],
  },
  {
    heading: "Teams + permissions",
    rows: [
      { label: "Seats included", solo: "1", team: "3", agency: "Unlimited" },
      { label: "Extra seats", solo: "—", team: "$4 / seat", agency: "Included" },
      { label: "Approval workflows", solo: false, team: true, agency: true },
      { label: "Role permissions", solo: false, team: "basic", agency: "granular" },
      { label: "SSO (SAML) + SCIM", solo: false, team: false, agency: true },
      { label: "Audit log", solo: false, team: false, agency: true },
    ],
  },
  {
    heading: "Analytics + reporting",
    rows: [
      {
        label: "Analytics history",
        solo: "30 days",
        team: "2 years",
        agency: "Unlimited",
      },
      { label: "CSV export", solo: true, team: true, agency: true },
      { label: "Scheduled reports", solo: false, team: true, agency: true },
      { label: "White-label PDFs", solo: false, team: false, agency: true },
    ],
  },
  {
    heading: "Support",
    rows: [
      {
        label: "Support channel",
        solo: "Community",
        team: "Email",
        agency: "Priority + Slack",
      },
      {
        label: "First-response target",
        solo: "—",
        team: "1 business day",
        agency: "4 business hours",
      },
      { label: "Dedicated onboarding", solo: false, team: false, agency: true },
    ],
  },
];

const VS = [
  {
    n: "Buffer",
    us: "$16 / mo all-in, 3 seats included",
    them: "From ~$60 / mo once you add a second channel + second seat",
    href: "/compare/buffer",
  },
  {
    n: "Kit (ConvertKit)",
    us: "$16 / mo for the social side, 8 channels, 3 seats",
    them: "$33 / mo Creator — then $66 / mo for team features",
    href: "/compare/kit",
  },
  {
    n: "Hootsuite",
    us: "$16 / mo · no per-channel tax · real human support on Team",
    them: "From $99 / mo · 10-channel cap · enterprise-gated features",
    href: "/compare/hootsuite",
  },
];

const FAQ = [
  {
    q: "Is the free plan really free forever?",
    a: "Really free. 3 channels, 10 scheduled posts per channel per month, no card required, no trial countdown. You only pay when you pick Team or Agency — and you can stay on Solo indefinitely.",
  },
  {
    q: "Do you charge per channel like Buffer?",
    a: "No. Team is $16/month for 8 channels and 3 seats — one flat price. Buffer charges per channel from their Essentials tier; once you add 4 channels you're past $20/month.",
  },
  {
    q: "What's the catch with the 14-day trial?",
    a: "Nothing. You get full Team-plan access for 14 days, no card at signup. If you don't pick a plan by day 15, you automatically drop to Solo — your data stays, your queue stays, nothing is deleted.",
  },
  {
    q: "Do you offer nonprofit or student discounts?",
    a: "Yes — 40% off Team or Agency for registered nonprofits, full-time students, and maintainers of open-source projects with more than 1,000 stars. Email sales@usealoha.app with proof and we'll apply it manually.",
  },
  {
    q: "Can I switch plans mid-cycle?",
    a: "Yes. Upgrade at any time and we prorate. Downgrade takes effect at the next renewal — nothing is deleted, posts beyond the lower plan's limits pause until you publish or remove them.",
  },
  {
    q: "What happens if a platform deprecates an API?",
    a: "Historical analytics stay. For new data we fall back to what the platform permits and flag the gap in the dashboard — no silent blanks. If a channel is removed entirely, we prorate your next bill.",
  },
  {
    q: "Do you offer annual or multi-year discounts?",
    a: "Annual billing is ~17% cheaper than month-to-month (included in the price above). No multi-year lock-in; we don't think calm tools should use expiry dates as leverage.",
  },
];

const PRICING_SOFTWARE_APP = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Aloha",
  url: absoluteUrl(routes.pricing),
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, iOS, Android",
  description:
    "Aloha is a calm social media OS for creators and small teams. Three pricing tiers: Solo creator (free), Working team ($16/mo), Agency ($49/mo).",
  offers: {
    "@type": "AggregateOffer",
    offerCount: TIERS.length,
    lowPrice: "0",
    highPrice: "49",
    priceCurrency: "USD",
    offers: TIERS.map((t) => ({
      "@type": "Offer",
      name: t.name,
      description: t.desc,
      price: t.priceValue,
      priceCurrency: t.priceCurrency,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: t.priceValue,
        priceCurrency: t.priceCurrency,
        referenceQuantity: {
          "@type": "QuantitativeValue",
          value: 1,
          unitCode: "MON",
        },
      },
      availability: "https://schema.org/InStock",
      url: absoluteUrl(routes.pricing),
    })),
  },
};

export default function PricingPage() {
  return (
    <>
      <JsonLd
        data={[
          PRICING_SOFTWARE_APP,
          breadcrumbJsonLd([
            { name: "Home", path: routes.home },
            { name: "Pricing", path: routes.pricing },
          ]),
          faqJsonLd(FAQ),
        ]}
      />

      {/* ─── HERO ────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-peach-200 pb-16 lg:pb-20">
        <span
          aria-hidden
          className="absolute top-[14%] left-[5%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none"
        >
          ✳
        </span>
        <span
          aria-hidden
          className="absolute top-[68%] right-[8%] font-display text-[22px] text-primary/55 rotate-14 select-none"
        >
          +
        </span>
        <span
          aria-hidden
          className="absolute top-[28%] right-[10%] font-display text-[38px] text-ink/15 rotate-18 select-none"
        >
          ※
        </span>
      </header>

      <section className="bg-peach-200 wavy">
        <div className="relative max-w-[1320px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-20 lg:pb-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
              Pricing
            </div>
            <h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
              One honest price.
              <br />
              <span className="text-primary font-light">
                No per-channel tax.
              </span>
            </h1>
            <p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
              Three plans. Free forever at the bottom, $16 in the middle, $49
              for agencies. Everything below the price is included —
              including the things other tools gate behind &ldquo;contact
              sales&rdquo;.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-ink/65">
              <span className="inline-flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
                14-day trial on paid plans
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
                No card at signup
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
                Cancel in one click
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TIER CARDS ──────────────────────────────────────────────── */}
      <section className="bg-peach-200">
        <section className="bg-background py-16 lg:py-24 wavy">
          <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {TIERS.map((t) => (
                <article
                  key={t.slug}
                  className={`relative rounded-3xl p-8 lg:p-10 ${t.accent} flex flex-col ${
                    t.featured ? "lg:-translate-y-3" : ""
                  }`}
                >
                  {t.featured && (
                    <span className="absolute top-5 right-5 inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink bg-background-elev px-2 py-1 rounded-full">
                      <Sparkle className="w-3 h-3 text-primary" /> Most-picked
                    </span>
                  )}
                  <t.Icon className="w-6 h-6 text-ink" />
                  <h2 className="mt-6 font-display text-[30px] leading-tight">
                    {t.name}
                  </h2>
                  <p className="mt-1 text-[13px] text-ink/70">{t.tagline}</p>
                  <p className="mt-5 text-[14.5px] text-ink/80 leading-[1.55]">
                    {t.desc}
                  </p>

                  <ul className="mt-7 space-y-2.5 text-[13.5px] text-ink/80 flex-1">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check
                          className="w-3.5 h-3.5 mt-[3px] text-ink/70 shrink-0"
                          strokeWidth={2.5}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 pt-6 border-t border-ink/10">
                    <p className="text-[12.5px] text-ink/65 mb-4">
                      <span className="font-medium text-ink">
                        {t.priceLine}
                      </span>
                      <span className="text-ink/45"> · {t.priceSub}</span>
                    </p>
                    <Link
                      href={t.ctaHref}
                      className={`inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full font-medium text-[13.5px] transition-colors w-full ${
                        t.featured
                          ? "bg-primary text-primary-foreground hover:bg-primary-deep"
                          : "bg-ink text-background-elev hover:bg-primary"
                      }`}
                    >
                      {t.cta}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <p className="mt-10 text-[13px] text-ink/60 flex flex-wrap items-center gap-x-6 gap-y-2">
              <span>
                <span className="font-display text-ink">
                  Nonprofits, students, and OSS maintainers
                </span>
                <span className="text-ink/55"> — 40% off, just ask.</span>
              </span>
              <span className="text-ink/30">·</span>
              <span>Move between plans any time. Your content moves with you.</span>
            </p>
          </div>
        </section>
      </section>

      {/* ─── FEATURE MATRIX ──────────────────────────────────────────── */}
      <section className="bg-background-elev py-24 lg:py-32 wavy">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="mb-12 lg:mb-14 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              Full comparison
            </p>
            <h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
              Every row,
              <br />
              <span className="text-primary">every plan.</span>
            </h2>
            <p className="mt-6 text-[15.5px] text-ink/70 leading-[1.55]">
              No gated &ldquo;enterprise-only&rdquo; column. If it's in the
              product, it's on this page.
            </p>
          </div>

          <div className="rounded-3xl bg-background border border-border overflow-hidden">
            <div className="grid grid-cols-12 px-6 lg:px-8 py-4 text-[11px] font-mono uppercase tracking-[0.18em] text-ink/55 border-b border-border sticky top-0 bg-background z-10">
              <div className="col-span-6 lg:col-span-6">Feature</div>
              <div className="col-span-2 text-center">Solo</div>
              <div className="col-span-2 text-center">Team</div>
              <div className="col-span-2 text-center">Agency</div>
            </div>

            {MATRIX.map((section) => (
              <div key={section.heading}>
                <div className="px-6 lg:px-8 py-3 bg-peach-100/40 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/70">
                  {section.heading}
                </div>
                {section.rows.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-12 px-6 lg:px-8 py-4 border-t border-border text-[14px] items-center"
                  >
                    <div className="col-span-6 lg:col-span-6 text-ink">
                      <span>{row.label}</span>
                      {row.note && (
                        <span className="ml-2 text-[12px] text-ink/55">
                          — {row.note}
                        </span>
                      )}
                    </div>
                    <MatrixCell value={row.solo} />
                    <MatrixCell value={row.team} />
                    <MatrixCell value={row.agency} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VS COMPETITORS ──────────────────────────────────────────── */}
      <section className="bg-background py-24 lg:py-32 wavy">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-10 items-end">
            <div className="col-span-12 lg:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
                The quick math
              </p>
              <h2 className="font-display text-[32px] lg:text-[44px] leading-[1.02] tracking-[-0.02em]">
                What you'd pay
                <br />
                <span className="text-primary">everywhere else.</span>
              </h2>
            </div>
            <p className="col-span-12 lg:col-span-4 text-[15.5px] text-ink/70 leading-[1.55]">
              Apples to apples, year 2026. Prices pulled from public listings
              on each competitor's pricing page; we re-verify quarterly.
            </p>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {VS.map((v) => (
              <li
                key={v.n}
                className="rounded-3xl bg-peach-100 p-7 lg:p-8 flex flex-col"
              >
                <p className="font-display text-[24px] leading-tight tracking-[-0.01em]">
                  Aloha vs {v.n}
                </p>
                <dl className="mt-6 space-y-4 text-[13.5px] text-ink/80 flex-1">
                  <div>
                    <dt className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55 mb-1">
                      Aloha Team
                    </dt>
                    <dd>{v.us}</dd>
                  </div>
                  <div>
                    <dt className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55 mb-1">
                      {v.n}
                    </dt>
                    <dd>{v.them}</dd>
                  </div>
                </dl>
                <Link
                  href={v.href}
                  className="mt-6 pencil-link inline-flex items-center gap-1.5 text-[13px] font-medium text-ink"
                >
                  Full comparison <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────────── */}
      <section className="bg-background-elev py-24 lg:py-32 wavy">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="mb-12 lg:mb-14 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
              Pricing FAQ
            </p>
            <h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
              The questions
              <br />
              <span className="text-primary">we actually get.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
            {FAQ.map((f) => (
              <article
                key={f.q}
                className="rounded-3xl bg-background border border-border p-7 lg:p-8"
              >
                <h3 className="font-display text-[20px] leading-[1.2] tracking-[-0.005em] text-ink">
                  {f.q}
                </h3>
                <p className="mt-4 text-[14.5px] leading-[1.6] text-ink/80">
                  {f.a}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink text-background-elev wavy">
        <div
          aria-hidden
          className="absolute inset-0 opacity-10 -z-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
        />
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end">
            <div className="col-span-12 lg:col-span-8">
              <h2 className="font-display text-[44px] sm:text-[56px] lg:text-[80px] leading-[0.98] tracking-[-0.025em]">
                Start on the free plan.
                <br />
                <span className="text-peach-300">Move when it's worth it.</span>
              </h2>
            </div>
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:items-end">
              <Link
                href={routes.signup}
                className="inline-flex items-center gap-2 h-14 px-7 rounded-full text-background font-medium text-[15px] bg-primary transition-colors"
              >
                Start free — no card
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={routes.compare.whyDifferent}
                className="pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium"
              >
                Why Aloha is different
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function MatrixCell({ value }: { value: boolean | string }) {
  return (
    <div className="col-span-2 text-center text-[13.5px] text-ink/80">
      {value === true ? (
        <Check className="inline w-4 h-4 text-primary" strokeWidth={2.5} />
      ) : value === false ? (
        <Minus className="inline w-4 h-4 text-ink/25" strokeWidth={2.5} />
      ) : (
        <span>{value}</span>
      )}
    </div>
  );
}
