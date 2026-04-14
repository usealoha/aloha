"use client";

import type { CurrentUser } from "@/lib/current-user";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  PenSquare,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AvatarMenu } from "./avatar-menu";
import { NavLinks } from "./nav-links";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "aloha:sidebar:expanded";

export function AppSidebar({ user }: { user: CurrentUser }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") {
        setExpanded(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  const collapsed = !expanded;

  return (
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

      <div className="flex items-center pt-5 pb-4 px-3 h-[52px]">
        <Link
          href="/app/dashboard"
          className="inline-flex items-baseline gap-0.5 pl-3"
          aria-label="Aloha home"
        >
          <span className="font-display text-[24px] leading-none font-semibold tracking-[-0.03em] text-ink">
            {collapsed ? "A" : "Aloha"}
          </span>
          <span className="font-display text-primary text-[18px] leading-none">
            .
          </span>
        </Link>
      </div>

      <div className="pb-4 px-3">
        <Link
          href="/app/composer"
          aria-label="Compose"
          className="group relative flex items-center gap-3 h-10 w-full px-3 rounded-full bg-ink text-background hover:bg-primary transition-colors"
        >
          <PenSquare className="w-[18px] h-[18px] shrink-0 ml-[1px]" />
          <span
            className={cn(
              "text-[13.5px] font-medium whitespace-nowrap overflow-hidden transition-opacity",
              collapsed
                ? "w-0 opacity-0 pointer-events-none"
                : "opacity-100",
            )}
          >
            Compose
          </span>
          {collapsed ? (
            <span
              role="tooltip"
              className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-ink text-background text-[12px] font-medium whitespace-nowrap opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 shadow-[0_8px_24px_-8px_rgba(26,22,18,0.3)] z-50"
            >
              Compose
            </span>
          ) : null}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-visible px-3">
        <NavLinks variant="sidebar" collapsed={collapsed} />
      </nav>

      <div className="py-3 px-3 border-t border-border">
        <div
          className={cn(
            "flex gap-2",
            collapsed ? "flex-col items-center" : "items-center justify-between",
          )}
        >
          <AvatarMenu
            name={user.name}
            email={user.email}
            image={user.image}
            workspaceName={user.workspaceName}
            placement="top"
            expandedLabel={!collapsed}
          />
          <button
            type="button"
            aria-label="Notifications"
            title={collapsed ? "Notifications" : undefined}
            className="relative h-9 w-9 shrink-0 grid place-items-center rounded-full text-ink/70 hover:text-ink hover:bg-muted/60 transition-colors"
          >
            <Bell className="w-[17px] h-[17px]" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary" />
          </button>
        </div>
      </div>
    </aside>
  );
}
