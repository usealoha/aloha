"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggle({
  className,
  expandedLabel = false,
}: {
  className?: string;
  expandedLabel?: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";
  const shortLabel = isDark ? "Light mode" : "Dark mode";

  const button = (
    <button
      type="button"
      aria-label={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "group flex items-center h-10 w-full rounded-xl gap-3 px-3 text-[14px] font-medium text-ink/70 hover:text-ink hover:bg-muted/60 transition-colors",
        className,
      )}
    >
      {isDark ? (
        <Sun className="w-[18px] h-[18px] shrink-0 text-ink/50 group-hover:text-ink transition-colors" />
      ) : (
        <Moon className="w-[18px] h-[18px] shrink-0 text-ink/50 group-hover:text-ink transition-colors" />
      )}
      {expandedLabel ? <span className="truncate">{shortLabel}</span> : null}
    </button>
  );

  if (expandedLabel) return button;

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent side="right" sideOffset={12}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
