"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminNavLinks } from "./admin-nav-links";
import { AdminMenu } from "./admin-menu";
import { ThemeToggle } from "../../app/_components/theme-toggle";

const STORAGE_KEY = "aloha:admin-sidebar:expanded";

export function AdminSidebar({ email, role }: { email: string; role: string }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") setExpanded(true);
    } catch {}
  }, []);

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  const collapsed = !expanded;

  return (
    <TooltipProvider delay={120}>
      <aside
        className={cn(
          "relative hidden lg:flex lg:flex-col sticky top-0 h-screen shrink-0 border-r border-border bg-background-elev/60 backdrop-blur-md transition-[width] duration-200",
          collapsed ? "w-[68px]" : "w-[248px]",
        )}
      >
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute top-7 right-0 translate-x-1/2 z-10 h-6 w-6 grid place-items-center rounded-full border border-border-strong bg-background-elev text-ink/60 hover:text-ink hover:bg-muted/80 shadow-[0_4px_12px_-4px_rgba(26,22,18,0.18)] transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-[14px] h-[14px]" />
          ) : (
            <ChevronLeft className="w-[14px] h-[14px]" />
          )}
        </button>

        <div className="flex flex-col pt-5 pb-4 px-3 min-h-[72px]">
          <Link
            href="/admin"
            className="inline-flex items-baseline gap-0.5 pl-3"
            aria-label="Aloha admin home"
          >
            <span className="font-display text-[24px] leading-none font-semibold tracking-[-0.03em] text-ink">
              {collapsed ? "A" : "Aloha"}
            </span>
            <span className="font-display text-primary text-[18px] leading-none">
              .
            </span>
          </Link>
          <span className="mt-1 pl-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
            {collapsed ? "Adm" : "Admin"}
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3">
          <AdminNavLinks variant="sidebar" collapsed={collapsed} />
        </nav>

        <div className="py-3 px-3 border-t border-border">
          <div className="flex flex-col gap-1 items-stretch">
            <ThemeToggle expandedLabel={!collapsed} />
            <AdminMenu
              email={email}
              role={role}
              placement="top"
              expandedLabel={!collapsed}
            />
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
