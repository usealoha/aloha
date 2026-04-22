import Link from "next/link";
import { AdminNavLinks } from "./admin-nav-links";
import { AdminMenu } from "./admin-menu";

export function AdminTopBar({ email, role }: { email: string; role: string }) {
  return (
    <div className="lg:hidden sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex items-center justify-between px-5 h-[60px]">
        <Link
          href="/admin"
          className="flex items-baseline gap-1"
          aria-label="Aloha admin home"
        >
          <span className="font-display text-[22px] leading-none font-semibold tracking-[-0.03em] text-ink">
            Aloha
          </span>
          <span className="font-display text-primary text-[17px] leading-none">
            .
          </span>
          <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
            Admin
          </span>
        </Link>
        <div className="flex items-center gap-1.5">
          <AdminMenu email={email} role={role} />
        </div>
      </div>
      <div className="px-4 pb-2">
        <AdminNavLinks />
      </div>
    </div>
  );
}
