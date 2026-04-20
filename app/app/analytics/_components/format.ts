export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(0)}K`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function formatDelta(pct: number | null): {
  label: string;
  tone: "up" | "down" | "flat";
} {
  if (pct === null) return { label: "no prior data", tone: "flat" };
  if (pct === 0) return { label: "0%", tone: "flat" };
  const sign = pct > 0 ? "+" : "";
  return {
    label: `${sign}${pct}%`,
    tone: pct > 0 ? "up" : "down",
  };
}

export const PROVIDER_LABELS: Record<string, string> = {
  twitter: "X",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  bluesky: "Bluesky",
  threads: "Threads",
  medium: "Medium",
  youtube: "YouTube",
  pinterest: "Pinterest",
};
