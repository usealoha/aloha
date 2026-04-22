import Link from "next/link";
import type { ReactNode } from "react";

export function AdminPageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-display text-[44px] lg:text-[52px] leading-[1.04] tracking-[-0.03em] text-ink font-normal">
          {title}
          <span className="text-primary font-light">.</span>
        </h1>
        {subtitle ? (
          <p className="mt-3 text-[15px] text-ink/65 max-w-xl leading-[1.55]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  actionLabel,
  actionHref,
}: {
  eyebrow: string;
  title: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          {eyebrow}
        </p>
        <h2 className="mt-1.5 font-display text-[26px] leading-[1.1] tracking-[-0.02em] text-ink">
          {title}
        </h2>
      </div>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="pencil-link text-[13px] text-ink/70 hover:text-ink"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <article className="rounded-2xl border border-border bg-background-elev p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
        {label}
      </p>
      <p className="mt-3 font-display text-[32px] leading-none tracking-[-0.02em] text-ink">
        {value}
      </p>
      {hint ? <p className="mt-2 text-[12px] text-ink/55">{hint}</p> : null}
    </article>
  );
}

export function DataCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`rounded-2xl border border-border bg-background-elev overflow-hidden ${className}`}
    >
      {children}
    </article>
  );
}
