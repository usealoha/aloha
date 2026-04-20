"use client";

import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { navItems, routes } from "@/lib/routes";

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
    <nav className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="max-w-[1320px] mx-auto flex items-center justify-between px-6 lg:px-10 h-[72px]">
        <div className="flex items-center gap-12">
          <Link href={routes.home} className="flex items-baseline gap-1 group">
            <span className="font-display text-[28px] leading-none font-semibold tracking-[-0.03em] text-ink">
              Aloha
            </span>
            <span className="font-display text-primary text-[22px] leading-none">.</span>
          </Link>
          <ul className="hidden lg:flex items-center gap-8">
            {navItems.map((i) => (
              <li key={i.href}>
                <Link
                  href={i.href}
                  className="pencil-link text-[14px] font-medium text-ink/80 hover:text-ink"
                >
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={routes.signin}
            className="hidden sm:inline-flex h-10 items-center px-4 text-[14px] font-medium text-ink/80 hover:text-ink"
          >
            Sign in
          </Link>
          <Link
            href={routes.signup}
            className="inline-flex h-10 items-center gap-1.5 bg-ink text-background px-5 rounded-full text-[13.5px] font-medium hover:bg-primary transition-colors"
          >
            Start free
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="marketing-mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-full border border-border text-ink hover:bg-muted/60 transition-colors"
          >
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

    </nav>
    {open && (
      <div
        id="marketing-mobile-menu"
        className="lg:hidden fixed inset-x-0 top-[72px] bottom-0 z-40 bg-background overflow-y-auto"
      >
        <div className="px-6 py-8">
          <ul className="flex flex-col divide-y divide-border">
            {navItems.map((i) => (
              <li key={i.href}>
                <Link
                  href={i.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between py-4 text-[18px] font-display text-ink"
                >
                  {i.label}
                  <ArrowRight className="w-4 h-4 text-ink/70" />
                </Link>
              </li>
            ))}
            <li className="sm:hidden">
              <Link
                href={routes.signin}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between py-4 text-[18px] font-display text-ink"
              >
                Sign in
                <ArrowRight className="w-4 h-4 text-ink/70" />
              </Link>
            </li>
          </ul>
        </div>
      </div>
    )}
    </>
  );
}
