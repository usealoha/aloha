// Shared tool metadata so pages can cross-link without hard-coding.
import { routes } from "@/lib/routes";

export type ToolItem = {
  slug: string;
  name: string;
  href: string;
  tagline: string;
  accent: string;
};

export const TOOLS: ToolItem[] = [
  {
    slug: "bio-generator",
    name: "Bio generator",
    href: routes.tools.bioGenerator,
    tagline: "Three bio variants from a 30-second prompt.",
    accent: "bg-peach-200",
  },
  {
    slug: "best-time-finder",
    name: "Best-time finder",
    href: routes.tools.bestTimeFinder,
    tagline: "Channel + timezone → quiet windows that still work.",
    accent: "bg-primary-soft",
  },
  {
    slug: "hashtag-decoder",
    name: "Hashtag decoder",
    href: routes.tools.hashtagDecoder,
    tagline: "Volume, competition, and vibe — for any tag.",
    accent: "bg-peach-100",
  },
  {
    slug: "post-critic",
    name: "Post critic",
    href: routes.tools.postCritic,
    tagline: "Paste a draft; get rule-based honest feedback.",
    accent: "bg-peach-300",
  },
  {
    slug: "caption-scrubber",
    name: "Caption scrubber",
    href: routes.tools.captionScrubber,
    tagline: "Strip shadowban-flagged characters and tidy whitespace.",
    accent: "bg-peach-100",
  },
];

export function siblingTools(currentSlug: string) {
  return TOOLS.filter((t) => t.slug !== currentSlug);
}
