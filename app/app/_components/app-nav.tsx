import Link from "next/link";
import { Bell, PenSquare } from "lucide-react";
import { NavLinks, type NavItem } from "./nav-links";
import { AvatarMenu } from "./avatar-menu";
import type { CurrentUser } from "@/lib/current-user";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/app/dashboard" },
  { label: "Calendar", href: "/app/calendar" },
  { label: "Composer", href: "/app/composer" },
  { label: "Audience", href: "/app/audience" },
  { label: "Automations", href: "/app/automations" },
];

export function AppNav({ user }: { user: CurrentUser }) {
  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="max-w-[1320px] mx-auto flex items-center justify-between px-6 lg:px-10 h-[72px]">
        <div className="flex items-center gap-10">
          <Link
            href="/app/dashboard"
            className="flex items-baseline gap-1"
            aria-label="Aloha home"
          >
            <span className="font-display text-[26px] leading-none font-semibold tracking-[-0.03em] text-ink">
              Aloha
            </span>
            <span className="font-display text-primary text-[20px] leading-none">
              .
            </span>
          </Link>
          <NavLinks items={NAV_ITEMS} />
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app/composer"
            className="hidden sm:inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13.5px] font-medium hover:bg-primary transition-colors"
          >
            <PenSquare className="w-3.5 h-3.5" />
            Compose
          </Link>
          <button
            type="button"
            aria-label="Notifications"
            className="relative h-10 w-10 grid place-items-center rounded-full text-ink/70 hover:text-ink hover:bg-muted/60 transition-colors"
          >
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-primary" />
          </button>
          <AvatarMenu
            name={user.name}
            email={user.email}
            image={user.image}
            workspaceName={user.workspaceName}
          />
        </div>
      </div>
    </nav>
  );
}
