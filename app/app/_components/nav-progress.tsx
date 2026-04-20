"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Top-edge progress bar. Starts on any in-app link click, eases toward
// 90%, and completes when the pathname/search params change. Position
// fixed so it never occupies layout flow — no CLS.
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const animRef = useRef<number | null>(null);

  // Start on any in-app navigation click (anchors, `<Link>`, buttons
  // inside anchors). Modifier clicks open a new tab — skip those.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/")) return;
      if (anchor.target === "_blank") return;
      if (href === pathname) return;
      setActive(true);
      setProgress(8);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname]);

  // Ease toward 90% while active; stop there until the route change
  // completes or aborts.
  useEffect(() => {
    if (!active) return;
    if (animRef.current) window.clearInterval(animRef.current);
    animRef.current = window.setInterval(() => {
      setProgress((p) => (p < 90 ? p + (90 - p) * 0.08 : p));
    }, 80);
    return () => {
      if (animRef.current) window.clearInterval(animRef.current);
    };
  }, [active]);

  // Route settled — finish and fade out.
  useEffect(() => {
    if (!active) return;
    setProgress(100);
    const t = window.setTimeout(() => {
      setActive(false);
      setProgress(0);
    }, 220);
    return () => window.clearTimeout(t);
    // Reacts to pathname + search changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 h-[2px] z-50 pointer-events-none"
    >
      <div
        className="h-full bg-primary shadow-[0_0_8px_rgba(0,0,0,0.15)]"
        style={{
          width: `${progress}%`,
          opacity: active ? 1 : 0,
          transition: "width 200ms ease-out, opacity 220ms ease-out",
        }}
      />
    </div>
  );
}
