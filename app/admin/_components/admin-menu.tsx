"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, LogOut, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAdmin } from "../_actions/auth";

export function AdminMenu({
  email,
  role,
  placement = "bottom",
  expandedLabel = false,
}: {
  email: string;
  role: string;
  placement?: "top" | "bottom";
  expandedLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initials = email
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const avatarBox = (
    <span
      className={cn(
        "h-9 w-9 shrink-0 rounded-full overflow-hidden border border-border-strong grid place-items-center bg-peach-100 text-ink text-[12px] font-semibold transition-colors",
        open && "ring-2 ring-ink/15",
      )}
    >
      {initials || "A"}
    </span>
  );

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2.5 rounded-full transition-colors",
          expandedLabel
            ? "w-full text-left px-1 py-1 pr-3 hover:bg-muted/60"
            : "w-full justify-center py-1 hover:bg-muted/60",
        )}
      >
        {avatarBox}
        {expandedLabel ? (
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] text-ink truncate">
              {email}
            </span>
            <span className="block text-[11.5px] text-ink/55 uppercase tracking-[0.14em]">
              {role}
            </span>
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute w-[280px] rounded-2xl border border-border-strong bg-background-elev shadow-[0_18px_48px_-24px_rgba(26,22,18,0.25)] overflow-hidden z-50",
            placement === "top" ? "bottom-full mb-2 left-0" : "right-0 mt-2",
          )}
        >
          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full overflow-hidden border border-border-strong grid place-items-center bg-peach-100 text-[12.5px] font-semibold text-ink shrink-0">
                {initials || "A"}
              </span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-medium text-ink truncate">
                  {email}
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-[11.5px] text-primary-deep">
                  <ShieldCheck className="w-3 h-3" />
                  <span className="capitalize">{role.toLowerCase()}</span>
                </p>
              </div>
            </div>
          </div>

          <ul className="py-1 text-[13.5px]">
            <li>
              <Link
                href="/app/dashboard"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 inline-flex items-center gap-2.5 w-full text-ink/80 hover:bg-muted/60 transition-colors"
              >
                <ArrowUpRight className="w-4 h-4 text-ink/60" />
                Back to main app
              </Link>
            </li>
          </ul>

          <div className="border-t border-border py-1">
            <form action={signOutAdmin}>
              <button
                type="submit"
                role="menuitem"
                className="w-full px-4 py-2.5 text-left text-[13.5px] text-ink/80 hover:bg-muted/60 inline-flex items-center gap-2.5 transition-colors"
              >
                <LogOut className="w-4 h-4 text-ink/60" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
