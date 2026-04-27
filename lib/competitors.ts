// Competitor comparison data — powers /compare/[competitor].
//
// Tone rule: honest, gracious, no hit pieces. Every page declares a
// `verifiedOn` date and surfaces "where they're stronger" first.
// When adding a competitor, also add its slug to routes.compare in
// lib/routes.ts.

export type FeatureStatus = "yes" | "partial" | "no" | "addon" | "planned";

export type FeatureRow = {
  label: string;
  aloha: FeatureStatus;
  alohaNote?: string;
  them: FeatureStatus;
  themNote?: string;
};

export type Competitor = {
  slug: string;
  // Display name — appears in "Aloha vs {name}".
  name: string;
  // Short positioning ("the original honest social tool", "the enterprise
  // suite", etc.). Used in the hero lead.
  positioning: string;
  // Tone-setting lead paragraph for the hero. Should be gracious.
  lead: string;
  // Accent for the hero card / Aloha column in the matrix.
  accent: "bg-peach-100" | "bg-peach-200" | "bg-peach-300" | "bg-primary-soft";
  // ISO date, shown prominently. Forces us to re-verify quarterly.
  verifiedOn: string;
  // Human-readable verify date.
  verifiedLabel: string;
  // Three things we'll say plainly — theirs is better.
  theyWin: { h: string; p: string }[];
  // Three things we'll say plainly — ours is better.
  weWin: { h: string; p: string }[];
  // The feature matrix. Keep rows stable across competitors for parity.
  matrix: FeatureRow[];
  // One-line summary of who should stay with competitor vs. try Aloha.
  verdict: string;
  // One quote from a migrator.
  testimonial: { q: string; n: string; r: string; ini: string };
  // Migration notes — any quirks (e.g., Buffer export format).
  migration: { steps: string[]; caveat?: string };
};

export const COMPETITORS: Record<string, Competitor> = {
  buffer: {
    slug: "buffer",
    name: "Buffer",
    positioning: "the calm, creator-first schedule-and-analyse tool",
    lead:
      "We're fans. Buffer has shaped the way this whole category reads for a decade. Aloha borrows the clarity and adds the pieces Buffer has chosen not to build — Muse (our style-trained voice model) and a unified inbox. Here's where we overlap, where we diverge, and who should stay with Buffer.",
    accent: "bg-peach-100",
    verifiedOn: "2026-04-10",
    verifiedLabel: "Apr 10, 2026",
    theyWin: [
      {
        h: "Longer track record",
        p: "Buffer has been doing this since 2010. If you want a tool with a decade of stability and a predictable release cadence, Buffer wins on track record alone.",
      },
      {
        h: "Simpler learning curve",
        p: "Buffer's UI is famously clean. If all you need is 'schedule a post to three channels', Buffer is faster to learn and set up.",
      },
      {
        h: "Ideas library",
        p: "Buffer's 'Ideas' inbox — where you capture content seeds — is a delightful, focused feature we don't replicate.",
      },
    ],
    weWin: [
      {
        h: "Muse, not templates",
        p: "Muse — Aloha's voice model inside Composer — writes in your cadence after learning from your best posts. Buffer's AI Assistant uses generic prompts with one shared tone.",
      },
      // Automation canvas advantage hidden in production; preserved for re-enable.
      // {
      //   h: "Automation canvas",
      //   p: "The Logic Matrix lets you wire triggers, conditions and actions — welcome DMs, cross-post chains, reply triage. Buffer has none of this.",
      // },
      {
        h: "Unified inbox",
        p: "Every comment and DM across every channel in one triageable list. Buffer's inbox is limited and costs extra on Team plans.",
      },
    ],
    matrix: [
      { label: "Scheduling across 8 networks", aloha: "yes", them: "yes" },
      { label: "Composer + Muse (style-trained voice)", aloha: "yes", alohaNote: "learns from your best posts", them: "partial", themNote: "generic AI Assistant" },
      { label: "Native reel + story scheduling", aloha: "yes", them: "yes" },
      { label: "Link-in-bio page included", aloha: "yes", alohaNote: "custom domain, no watermark", them: "addon", themNote: "Start Page, separate product" },
      { label: "Full analytics history on every plan", aloha: "yes", alohaNote: "24 months, incl. Free", them: "partial", themNote: "30 days on Free" },
      // { label: "Cross-channel automation canvas", aloha: "yes", them: "no" },  // hidden in production
      { label: "Unified inbox (comments + DMs)", aloha: "yes", them: "partial", themNote: "Engage, Team-plan add-on" },
      { label: "Approval workflows", aloha: "yes", them: "yes" },
      { label: "Mobile app (iOS + Android)", aloha: "yes", them: "yes" },
      { label: "CSV / JSON export", aloha: "yes", them: "partial", themNote: "CSV only" },
      { label: "API + webhooks", aloha: "yes", alohaNote: "public API + webhooks", them: "no" },
      { label: "SSO / SCIM", aloha: "yes", alohaNote: "on Agency plan", them: "yes" },
    ],
    verdict:
      "Stay with Buffer if you want the minimal, schedule-plus-analytics shape. Move to Aloha if you want Muse and a unified inbox without the add-on pricing.",
    testimonial: {
      q: "I migrated from Buffer in an afternoon. The importer didn't drop a single scheduled post — even the recurring ones landed right.",
      n: "Deniz K.",
      r: "Indie maker · 11K followers",
      ini: "D",
    },
    migration: {
      steps: [
        "Export your scheduled posts from Buffer via Settings → Export.",
        "In Aloha, go to Settings → Import → Buffer and drop the CSV.",
        "Reconnect your channels; Aloha maps each post to the right network.",
      ],
      caveat:
        "Buffer's Ideas inbox doesn't have a direct equivalent — those export as draft posts into the Composer library.",
    },
  },

  hootsuite: {
    slug: "hootsuite",
    name: "Hootsuite",
    positioning: "the enterprise all-in-one",
    lead:
      "Hootsuite is the category's enterprise suite — big, feature-heavy, and priced accordingly. Aloha is the calm alternative for the team of three that doesn't need fifty SKUs. If you need advanced analytics with 30 integrations, Hootsuite stays the right answer.",
    accent: "bg-primary-soft",
    verifiedOn: "2026-04-10",
    verifiedLabel: "Apr 10, 2026",
    theyWin: [
      {
        h: "Enterprise integrations",
        p: "Hootsuite integrates with Salesforce, ServiceNow, Tableau, and 30+ other enterprise systems. We don't.",
      },
      {
        h: "Advanced social listening",
        p: "Brandwatch-grade social listening with sentiment, share-of-voice, and competitive tracking. Our analytics are first-party-first; Hootsuite's are broader.",
      },
      {
        h: "Multi-brand agency scale",
        p: "If you manage 50+ brands, Hootsuite's workspace isolation and permission matrix is more mature.",
      },
    ],
    weWin: [
      {
        h: "10× less per seat",
        p: "Hootsuite's Professional tier starts at ~$100/month per user. Aloha's Working Team plan is $16/month for the team.",
      },
      {
        h: "Calm UI",
        p: "Hootsuite is dense by design. Aloha prioritises the two-thirds of the job you actually do daily.",
      },
      {
        h: "Muse — voice-trained AI",
        p: "Hootsuite has AI features, but they're template-driven. Muse is trained on your posts and writes in your cadence.",
      },
    ],
    matrix: [
      { label: "Scheduling across 8 networks", aloha: "yes", them: "yes" },
      { label: "Composer + Muse (style-trained voice)", aloha: "yes", them: "partial", themNote: "OwlyWriter templates" },
      { label: "Native reel + story scheduling", aloha: "yes", them: "yes" },
      { label: "Link-in-bio page included", aloha: "yes", them: "no" },
      { label: "Full analytics history on every plan", aloha: "yes", them: "partial", themNote: "tiered by plan" },
      // { label: "Cross-channel automation canvas", aloha: "yes", them: "no" },  // hidden in production
      { label: "Unified inbox (comments + DMs)", aloha: "yes", them: "yes" },
      { label: "Approval workflows", aloha: "yes", them: "yes" },
      { label: "Mobile app (iOS + Android)", aloha: "yes", them: "yes" },
      { label: "CSV / JSON export", aloha: "yes", them: "yes" },
      { label: "API + webhooks", aloha: "yes", them: "yes" },
      { label: "SSO / SCIM", aloha: "yes", them: "yes" },
    ],
    verdict:
      "Stay with Hootsuite if you need Salesforce-grade integrations, enterprise listening, and a mature permissions model. Move to Aloha for a calmer tool that costs a tenth.",
    testimonial: {
      q: "We were spending $1,200 a month on Hootsuite for 3 people. Aloha does 90% of what we actually used, for $48.",
      n: "Sam W.",
      r: "Marketing lead · 4-person team",
      ini: "S",
    },
    migration: {
      steps: [
        "Export scheduled content from Hootsuite's Publisher via the 'Export to CSV' option.",
        "Export your organisation's brand kit separately from Settings → Assets.",
        "Import both into Aloha via Settings → Import → Hootsuite.",
      ],
      caveat:
        "Hootsuite's streams don't map 1:1 to Aloha — they become saved filters in the Inbox instead. Listening queries need to be recreated.",
    },
  },

  later: {
    slug: "later",
    name: "Later",
    positioning: "the visual-first Instagram scheduler",
    lead:
      "Later is beautiful for visual planners — especially if you live on Instagram. Aloha is broader: we're strong on voice and multi-channel. If Instagram is 80% of your work and the visual grid is your primary canvas, Later may still be your best bet.",
    accent: "bg-peach-200",
    verifiedOn: "2026-04-10",
    verifiedLabel: "Apr 10, 2026",
    theyWin: [
      {
        h: "Visual planner",
        p: "Later's Instagram grid preview — drag-and-drop, colour matching, visual rhythm — is genuinely lovely. We have a calendar; they have an art director's mood board.",
      },
      {
        h: "Linkin.bio",
        p: "Later's Linkin.bio is more commerce-aware than ours, with better shop tagging for product-heavy accounts.",
      },
      {
        h: "Influencer marketplace",
        p: "Later's creator marketplace for paid partnerships is a category leader; we don't have an equivalent.",
      },
    ],
    weWin: [
      {
        h: "Better on non-visual channels",
        p: "Later is Instagram-first. LinkedIn long-form, X threads, and YouTube shorts are full-citizens in Aloha.",
      },
      {
        h: "Muse",
        p: "Later's AI writes generic captions. Muse — Aloha's voice model inside Composer — learns your cadence.",
      },
      // Automation advantage hidden in production; preserved for re-enable.
      // {
      //   h: "Automation",
      //   p: "Logic Matrix wires cross-channel behaviours — welcome DMs, reply triage, launch sequences. Later doesn't.",
      // },
    ],
    matrix: [
      { label: "Scheduling across 8 networks", aloha: "yes", them: "partial", themNote: "6 networks, LinkedIn limited" },
      { label: "Composer + Muse (style-trained voice)", aloha: "yes", them: "partial", themNote: "generic AI captions" },
      { label: "Native reel + story scheduling", aloha: "yes", them: "yes" },
      { label: "Link-in-bio page included", aloha: "yes", them: "yes", themNote: "Linkin.bio, commerce-focused" },
      { label: "Full analytics history on every plan", aloha: "yes", them: "partial", themNote: "3 months on Starter" },
      // { label: "Cross-channel automation canvas", aloha: "yes", them: "no" },  // hidden in production
      { label: "Unified inbox (comments + DMs)", aloha: "yes", them: "no" },
      { label: "Approval workflows", aloha: "yes", them: "partial", themNote: "Teams plan only" },
      { label: "Mobile app (iOS + Android)", aloha: "yes", them: "yes" },
      { label: "CSV / JSON export", aloha: "yes", them: "partial", themNote: "CSV only" },
      { label: "API + webhooks", aloha: "yes", them: "no" },
      { label: "SSO / SCIM", aloha: "yes", them: "partial", themNote: "Enterprise only" },
    ],
    verdict:
      "Stay with Later if Instagram is 80% of your work and the visual grid matters more than multi-channel reach. Move to Aloha if LinkedIn, X, or YouTube are growing faster than your IG.",
    testimonial: {
      q: "I loved Later's grid. I didn't love paying for two tools because Later couldn't keep up with my LinkedIn. Aloha replaced both.",
      n: "Priya N.",
      r: "Ghostwriter · LinkedIn + Instagram",
      ini: "P",
    },
    migration: {
      steps: [
        "In Later, go to Settings → Account → Export content library.",
        "Upload the resulting zip in Aloha's Settings → Import → Later.",
        "Reconnect your accounts and verify the grid preview matches.",
      ],
      caveat:
        "Later's colour-palette grid layout imports as a draft album in the Composer — you can re-enable per-grid visual preview in Settings → Channels → Instagram.",
    },
  },

  "sprout-social": {
    slug: "sprout-social",
    name: "Sprout Social",
    positioning: "the enterprise comms + customer-care suite",
    lead:
      "Sprout Social is a mature, expensive, comms-team tool. If you have a customer-care organisation answering thousands of DMs a week, Sprout's Smart Inbox is a legitimate advantage. For most creators and small teams, it's overkill.",
    accent: "bg-primary-soft",
    verifiedOn: "2026-04-10",
    verifiedLabel: "Apr 10, 2026",
    theyWin: [
      {
        h: "Customer care at scale",
        p: "Sprout's Smart Inbox and case management are built for 10k+ messages a week. If you're a support org, Sprout's tooling is more mature than ours.",
      },
      {
        h: "Cross-network social listening",
        p: "Sprout ingests millions of public posts for sentiment + brand tracking — enterprise-scale listening we don't try to do.",
      },
      {
        h: "Salesforce-native workflows",
        p: "Sprout's Salesforce integration is deep and two-way. Ours is webhook-first and shallow.",
      },
    ],
    weWin: [
      {
        h: "Starts at $16, not $249",
        p: "Sprout's Standard plan is $249/seat/month. Our Working Team plan is $16/month total.",
      },
      {
        h: "Composer + Muse",
        p: "Sprout's content tooling is functional, not expressive. Muse drafts native-per-channel posts that sound like you.",
      },
      // Automation canvas advantage hidden in production; preserved for re-enable.
      // {
      //   h: "Automation canvas",
      //   p: "Sprout has rule-based automations. The Matrix is a full visual canvas — triggers, conditions, and actions you can see at a glance.",
      // },
    ],
    matrix: [
      { label: "Scheduling across 8 networks", aloha: "yes", them: "yes" },
      { label: "Composer + Muse (style-trained voice)", aloha: "yes", them: "no" },
      { label: "Native reel + story scheduling", aloha: "yes", them: "yes" },
      { label: "Link-in-bio page included", aloha: "yes", them: "no" },
      { label: "Full analytics history on every plan", aloha: "yes", them: "partial", themNote: "limits by plan" },
      // { label: "Cross-channel automation canvas", aloha: "yes", them: "partial", themNote: "rule-based only" },  // hidden in production
      { label: "Unified inbox (comments + DMs)", aloha: "yes", them: "yes", themNote: "Smart Inbox, strong" },
      { label: "Approval workflows", aloha: "yes", them: "yes" },
      { label: "Mobile app (iOS + Android)", aloha: "yes", them: "yes" },
      { label: "CSV / JSON export", aloha: "yes", them: "yes" },
      { label: "API + webhooks", aloha: "yes", them: "yes" },
      { label: "SSO / SCIM", aloha: "yes", them: "yes" },
    ],
    verdict:
      "Stay with Sprout if you run a customer-care org with high DM volume or need enterprise listening. Move to Aloha if you're spending $750+/month for features you don't use.",
    testimonial: {
      q: "Sprout made sense when we were a 30-person comms team. As a 5-person marketing team, it was a museum we paid to walk through.",
      n: "Jamie R.",
      r: "Head of marketing · B2B SaaS",
      ini: "J",
    },
    migration: {
      steps: [
        "Export publishing content from Sprout's Asset Library → Export.",
        "Export team + approval settings separately.",
        "Import via Aloha's Settings → Import → Sprout Social.",
      ],
      caveat:
        "Smart Inbox routing rules migrate as Inbox saved filters, not 1:1 cases. Open cases in Sprout stay in Sprout — close them out first.",
    },
  },

  kit: {
    slug: "kit",
    name: "Kit",
    positioning: "the newsletter-first creator platform",
    lead:
      "Kit (formerly ConvertKit) is the email platform for creators. It's great at email and increasingly good at creator commerce — but it's not a social scheduler. Aloha and Kit are complements more than competitors. If you're comparing them, you're probably deciding where 'content operations' live.",
    accent: "bg-peach-100",
    verifiedOn: "2026-04-10",
    verifiedLabel: "Apr 10, 2026",
    theyWin: [
      {
        h: "Email + creator commerce",
        p: "Kit's email deliverability, commerce (sell a course / product), and creator network are category-leading. Our email is capture-only.",
      },
      {
        h: "Creator Network",
        p: "Kit's recommendation engine surfaces newsletters to subscribers in other creators' funnels. Genuinely useful for list growth.",
      },
      {
        h: "Land in the inbox",
        p: "Kit is an email tool at heart — deliverability is better than our capture flows can offer.",
      },
    ],
    weWin: [
      {
        h: "Multi-channel social scheduling",
        p: "Aloha schedules across 8 networks natively. Kit doesn't; they integrate with Buffer for posting.",
      },
      {
        h: "Muse + per-channel rewrite",
        p: "One Aloha draft → native versions across every social channel, in your voice. Kit has neither.",
      },
      {
        h: "Unified inbox",
        p: "Comment triage and DMs across every channel — Kit stays out of social entirely.",
      },
    ],
    matrix: [
      { label: "Scheduling across 8 networks", aloha: "yes", them: "no" },
      { label: "Composer + Muse (style-trained voice)", aloha: "yes", them: "partial", themNote: "for email only" },
      { label: "Native reel + story scheduling", aloha: "yes", them: "no" },
      { label: "Link-in-bio page included", aloha: "yes", them: "yes", themNote: "Creator profile page" },
      { label: "Full analytics history on every plan", aloha: "yes", them: "partial", themNote: "email only" },
      // { label: "Cross-channel automation canvas", aloha: "yes", them: "partial", themNote: "email sequences" },  // hidden in production
      { label: "Unified inbox (comments + DMs)", aloha: "yes", them: "no" },
      { label: "Approval workflows", aloha: "yes", them: "no" },
      { label: "Mobile app (iOS + Android)", aloha: "yes", them: "yes" },
      { label: "CSV / JSON export", aloha: "yes", them: "yes" },
      { label: "API + webhooks", aloha: "yes", them: "yes" },
      { label: "SSO / SCIM", aloha: "yes", them: "partial", themNote: "Creator Pro tier" },
    ],
    verdict:
      "Keep Kit for email — it's the category leader. Add Aloha for everything you post that isn't an email. Most of our creators run both happily.",
    testimonial: {
      q: "Kit for the newsletter, Aloha for the rest. Don't make either of them do the other's job.",
      n: "Theo A.",
      r: "Newsletter writer · 24K subs",
      ini: "T",
    },
    migration: {
      steps: [
        "In Kit, export your subscriber list via Subscribers → Export.",
        "Keep Kit as your email system — Aloha isn't a replacement.",
        "Connect Kit ↔ Aloha via the Kit integration so new Aloha subscribers sync automatically.",
      ],
      caveat:
        "This isn't a migration so much as a pairing. Keep Kit for email broadcasts, put Aloha in charge of social and link-in-bio capture.",
    },
  },

  typefully: {
    slug: "typefully",
    name: "Typefully",
    positioning: "the X-and-threads-only writing tool",
    lead:
      "Typefully is beautifully focused on writing for X (and a little LinkedIn). If 95% of what you publish is threads, the distraction-free editor is a legitimate advantage. Aloha is broader by design — we carry threads alongside seven other channels.",
    accent: "bg-peach-100",
    verifiedOn: "2026-04-10",
    verifiedLabel: "Apr 10, 2026",
    theyWin: [
      {
        h: "Distraction-free X composer",
        p: "Typefully's editor is the platonic X thread writer. Monospace, countdowns, preview. For pure-X creators, it's unmatched.",
      },
      {
        h: "Thread analytics",
        p: "Typefully's analytics are laser-focused on thread performance — hook, drop-off, engagement curve. Ours are broader but less specialised.",
      },
      {
        h: "Lighter footprint",
        p: "If all you want is 'write a thread, schedule it, see what worked', Typefully is less than Aloha.",
      },
    ],
    weWin: [
      {
        h: "Eight channels, not two",
        p: "Typefully covers X + some LinkedIn. Aloha publishes across Instagram, TikTok, YouTube, Threads, Pinterest, Facebook too.",
      },
      {
        h: "Muse learns from everything",
        p: "Muse trains on your best posts across any channel. Typefully's AI is X-specific.",
      },
      {
        h: "Inbox + Calendar",
        p: "Typefully is a writing tool. Aloha is a writing tool, a comment triage tool, and a calendar.",
      },
    ],
    matrix: [
      { label: "Scheduling across 8 networks", aloha: "yes", them: "partial", themNote: "X + LinkedIn + Threads" },
      { label: "Composer + Muse (style-trained voice)", aloha: "yes", them: "partial", themNote: "X-specific AI" },
      { label: "Native reel + story scheduling", aloha: "yes", them: "no" },
      { label: "Link-in-bio page included", aloha: "yes", them: "no" },
      { label: "Full analytics history on every plan", aloha: "yes", them: "yes", themNote: "X-only" },
      // { label: "Cross-channel automation canvas", aloha: "yes", them: "no" },  // hidden in production
      { label: "Unified inbox (comments + DMs)", aloha: "yes", them: "no" },
      { label: "Approval workflows", aloha: "yes", them: "partial", themNote: "Team plan" },
      { label: "Mobile app (iOS + Android)", aloha: "yes", them: "yes", themNote: "iOS only" },
      { label: "CSV / JSON export", aloha: "yes", them: "partial", themNote: "CSV" },
      { label: "API + webhooks", aloha: "yes", them: "partial", themNote: "webhooks only" },
      { label: "SSO / SCIM", aloha: "yes", them: "no" },
    ],
    verdict:
      "Stay with Typefully if X is 95% of your work and you want the best writer's editor for it. Move to Aloha the day you start posting seriously on anything else.",
    testimonial: {
      q: "Typefully got me thread-shaped. Aloha got me writing thread-shaped thoughts for LinkedIn, Instagram, and a newsletter — from the same draft.",
      n: "Rosa M.",
      r: "Writer · 28K on X",
      ini: "R",
    },
    migration: {
      steps: [
        "In Typefully, export your drafts via Workspace → Export → JSON.",
        "Import to Aloha via Settings → Import → Typefully.",
        "Reconnect your X account; Aloha preserves the thread structure.",
      ],
    },
  },
};

export const COMPETITOR_SLUGS = Object.keys(COMPETITORS);
