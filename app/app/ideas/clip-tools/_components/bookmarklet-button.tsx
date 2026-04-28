"use client";

import { Link2 } from "lucide-react";

// The draggable bookmarklet trigger. Clicking it inside Aloha would try
// to run the `javascript:` URL on this page (where the user is logged in
// to Aloha — the bookmarklet would still work, but it's confusing UX), so
// we suppress the click and only honor the drag-to-bookmarks-bar gesture.
export function BookmarkletButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      onClick={(e) => e.preventDefault()}
      draggable="true"
      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium cursor-grab active:cursor-grabbing hover:bg-primary transition-colors"
    >
      <Link2 className="w-3.5 h-3.5" />
      Save to Aloha
    </a>
  );
}
