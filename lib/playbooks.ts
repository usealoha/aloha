// Playbooks index — tactical guides that each map to an MDX page at:
//   app/(marketing)/resources/playbooks/{slug}/page.mdx

import { routes } from "@/lib/routes";

export type Playbook = {
  slug: string;
  title: string;
  lead: string;
  date: string;
  dateLabel: string;
  readTime: string;
  steps: number;
  // What persona this is mostly aimed at (matches /for/[slug]).
  persona: "creators" | "small-business" | "agencies" | "teams" | "solopreneurs" | "nonprofits";
  accent: "bg-peach-100" | "bg-peach-200" | "bg-peach-300" | "bg-primary-soft";
  author: { name: string; role: string; ini: string; tone?: string };
  tags: string[];
};

export const PLAYBOOKS: Playbook[] = [
  {
    slug: "launch-week-7-beats",
    title: "Launch week, in seven beats",
    lead:
      "A six-week-out → launch-day → seven-days-after schedule for a product or piece of work. Borrowed from creators who consistently land their drops.",
    date: "2026-04-08",
    dateLabel: "April 8, 2026",
    readTime: "11 min",
    steps: 7,
    persona: "creators",
    accent: "bg-peach-200",
    author: { name: "Leilani Okafor", role: "Community", ini: "L", tone: "bg-ink" },
    tags: ["launches", "calendar", "templates"],
  },
  {
    slug: "inbox-sla-30-min",
    title: "Inbox SLA — 30 minutes, every weekday",
    lead:
      "How small business teams cover an inbox without anyone burning out. A four-rule playbook that turns 'always-on' into 'reliably responsive.'",
    date: "2026-03-21",
    dateLabel: "March 21, 2026",
    readTime: "8 min",
    steps: 4,
    persona: "small-business",
    accent: "bg-primary-soft",
    author: { name: "Aarohi Mehta", role: "Co-founder · Product", ini: "A", tone: "bg-ink" },
    tags: ["inbox", "operations", "team"],
  },
];

export function getPlaybook(slug: string): Playbook | undefined {
  return PLAYBOOKS.find((p) => p.slug === slug);
}

export function relatedPlaybooks(slug: string, count = 3) {
  return PLAYBOOKS.filter((p) => p.slug !== slug)
    .slice(0, count)
    .map((p) => ({
      title: p.title,
      href: `${routes.resources.playbooks}/${p.slug}`,
      read: p.readTime,
    }));
}
