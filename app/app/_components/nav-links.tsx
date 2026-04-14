"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = { label: string; href: string };

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <ul className="hidden md:flex items-center gap-1">
      {items.map((i) => {
        const isActive =
          pathname === i.href || pathname.startsWith(`${i.href}/`);
        return (
          <li key={i.href}>
            <Link
              href={i.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative inline-flex items-center h-10 px-3.5 text-[14px] font-medium transition-colors",
                isActive ? "text-ink" : "text-ink/65 hover:text-ink"
              )}
            >
              {i.label}
              {isActive ? (
                <span
                  aria-hidden
                  className="absolute left-3.5 right-3.5 -bottom-[1px] h-[2px] bg-primary rounded-full"
                />
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
