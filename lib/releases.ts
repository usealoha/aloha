export type ChangeTag = "new" | "improved" | "fixed";

export type Release = {
	version: string;
	date: string; // ISO
	dateLabel: string;
	title: string;
	lead: string;
	changes: { tag: ChangeTag; t: string }[];
	featured?: boolean;
	screenshotLabel?: string;
	screenshotNotes?: string;
	screenshotSrc?: string;
	screenshotAlt?: string;
};

export const RELEASES: Release[] = [
	{
		version: "0.6",
		date: "2026-04-19",
		dateLabel: "Apr 19, 2026",
		title: "Press kit, Atom feed, and a quieter app",
		lead: "Plumbing week. A proper changelog feed, a press kit worth linking to, and better instrumentation under the hood so we hear about crashes before you do.",
		changes: [
			{
				tag: "new",
				t: "Press kit page with brand assets and product screenshots you can actually use.",
			},
			{
				tag: "new",
				t: "Atom feed for the changelog, wired into the site's metadata so feed readers pick it up automatically.",
			},
			{
				tag: "improved",
				t: "Automations builder — simpler flow diagram and fewer steps to get a matrix live.",
			},
			{
				tag: "improved",
				t: "Errors now flow through a single capture wrapper into both Sentry and Axiom, so nothing falls between cracks.",
			},
			{
				tag: "fixed",
				t: "Added a global error boundary so a client-side crash shows a real page instead of going blank.",
			},
		],
	},
	{
		version: "0.5",
		date: "2026-04-15",
		dateLabel: "Apr 15, 2026",
		title: "The Logic Matrix lands, plus your first analytics view",
		lead: "Our automations canvas — triggers, conditions, actions — is in. Alongside it, an analytics dashboard that reads straight from platform insights rather than handing you a spreadsheet.",
		changes: [
			{
				tag: "new",
				t: "Logic Matrix: a visual canvas for triggers, conditions, and actions. Build flows without leaving the app.",
			},
			{
				tag: "new",
				t: "Analytics dashboard — platform-aware metrics across your connected channels.",
			},
			{
				tag: "new",
				t: "Readback for Bluesky and Threads. Public engagement on posts we published flows back into the inbox.",
			},
			{
				tag: "improved",
				t: "Calendar view extracted into a reusable component, so it renders the same everywhere you see it.",
			},
			{
				tag: "improved",
				t: "Marketing pages now use real product screenshots instead of placeholders.",
			},
		],
		featured: true,
		screenshotLabel: "Logic Matrix canvas.",
		screenshotSrc: "/aloha-matrix.webp",
		screenshotAlt:
			"Aloha Logic Matrix — automations list on the left with a canvas of trigger, condition, and action nodes wired together.",
	},
	{
		version: "0.4",
		date: "2026-04-11",
		dateLabel: "Apr 11, 2026",
		title: "Telegram channel and email broadcasts",
		lead: "Two new surfaces: Telegram as a first-class channel, and an email broadcasts add-on with real deliverability — your own sending domain, open and click tracking, the works.",
		changes: [
			{
				tag: "new",
				t: "Telegram as a native channel — connect a bot, schedule, publish.",
			},
			{
				tag: "new",
				t: "Broadcasts: send email campaigns to your audience. Available as a paid add-on.",
			},
			{
				tag: "new",
				t: "Sending domains with open and click tracking, plus webhook ingestion for delivery events.",
			},
			{
				tag: "new",
				t: "Billing is live — plans and add-ons run through Polar as the merchant of record.",
			},
			{
				tag: "fixed",
				t: "Telegram chat IDs overflowed 32-bit ints for some groups; now handled as big integers end-to-end.",
			},
		],
	},
	{
		version: "0.3",
		date: "2026-04-07",
		dateLabel: "Apr 7, 2026",
		title: "Campaigns with cadence",
		lead: "Campaigns grew up. Drip and evergreen cadence, theme-based scheduling, and the pause/resume/delete controls you'd expect when a launch plan changes mid-flight.",
		changes: [
			{
				tag: "new",
				t: "Drip and evergreen cadence on campaigns, with theme-based scheduling.",
			},
			{
				tag: "new",
				t: "Pause, resume, and delete controls on campaign detail and the campaigns list.",
			},
			{
				tag: "new",
				t: "Bulk delete on the posts list — select many, move them all at once.",
			},
			{
				tag: "improved",
				t: "Campaign prompts emit richer scaffolding so the first draft already has structure.",
			},
			{
				tag: "fixed",
				t: "Kind-picker was pulling in too much of the bundle; now loads on demand.",
			},
		],
	},
	{
		version: "0.2",
		date: "2026-04-04",
		dateLabel: "Apr 4, 2026",
		title: "Composer v2 with Muse scaffolding",
		lead: "The composer got its working shape. Muse drops in structured drafts per channel, the schedule popover respects your timezone, and the posts list finally lets you recover what you deleted.",
		changes: [
			{
				tag: "new",
				t: "Muse scaffolding panel in the composer — rich, structured drafts you can edit down instead of staring at a blank box.",
			},
			{
				tag: "new",
				t: "Timezone-aware scheduling across composer and calendar. Ten AM means ten AM where you are.",
			},
			{
				tag: "new",
				t: "Channel filtering, deleted-post recovery, and row actions in the posts list.",
			},
			{
				tag: "improved",
				t: "Composer panels moved to a single drawer tab pattern with single-line info bars — less chrome, more canvas.",
			},
			{
				tag: "fixed",
				t: "Schedule popover positioning and dashboard counts — only future scheduled posts are counted now.",
			},
		],
	},
	{
		version: "0.1",
		date: "2026-04-01",
		dateLabel: "Apr 1, 2026",
		title: "Private beta — the first working slice",
		lead: "The first version real people tried. Inbox, calendar, composer, and the publisher plumbing behind them — enough to run a week of posts through end-to-end.",
		changes: [
			{
				tag: "new",
				t: "Inbox with reply handling — comments, DMs, and mentions in one place.",
			},
			{
				tag: "new",
				t: "Publisher adapters for X, LinkedIn, Bluesky, Mastodon, Reddit, Pinterest, and YouTube.",
			},
			{
				tag: "new",
				t: "Calendar + composer working end-to-end with scheduled publishing.",
			},
		],
	},
];
