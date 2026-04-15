"use client";

import { useEffect, useRef } from "react";

export function GridScroll({
  initialHour,
  hourHeight,
  children,
}: {
  initialHour: number;
  hourHeight: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.scrollTop = initialHour * hourHeight;
  }, [initialHour, hourHeight]);

  return (
    <div
      ref={ref}
      className="relative overflow-y-auto max-h-[calc(100vh-320px)] min-h-[480px]"
    >
      {children}
    </div>
  );
}
