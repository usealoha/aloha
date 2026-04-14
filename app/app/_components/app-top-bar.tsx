import Link from "next/link";
import { Bell, PenSquare } from "lucide-react";
import { NavLinks } from "./nav-links";
import { AvatarMenu } from "./avatar-menu";
import type { CurrentUser } from "@/lib/current-user";

export function AppTopBar({ user }: { user: CurrentUser }) {
  return (
    <div className="lg:hidden sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex items-center justify-between px-5 h-[60px]">
        <Link
          href="/app/dashboard"
          className="flex items-baseline gap-1"
          aria-label="Aloha home"
        >
          <span className="font-display text-[22px] leading-none font-semibold tracking-[-0.03em] text-ink">
            Aloha
          </span>
          <span className="font-display text-primary text-[17px] leading-none">
            .
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <Link
            href="/app/composer"
            aria-label="Compose"
            className="h-9 w-9 grid place-items-center rounded-full bg-ink text-background hover:bg-primary transition-colors"
          >
            <PenSquare className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            aria-label="Notifications"
            className="relative h-9 w-9 grid place-items-center rounded-full text-ink/70 hover:text-ink hover:bg-muted/60 transition-colors"
          >
            <Bell className="w-[17px] h-[17px]" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary" />
          </button>
          <AvatarMenu
            name={user.name}
            email={user.email}
            image={user.image}
            workspaceName={user.workspaceName}
          />
        </div>
      </div>
      <div className="px-4 pb-2">
        <NavLinks />
      </div>
    </div>
  );
}
