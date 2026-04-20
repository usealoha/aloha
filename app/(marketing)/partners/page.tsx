import { routes } from "@/lib/routes";
import { makeMetadata, SITE_URL } from "@/lib/seo";
import {
	ArrowRight,
	ArrowUpRight,
	Building,
	Handshake,
	Puzzle,
	Sparkle,
	Users,
} from "lucide-react";

export const metadata = makeMetadata({
	title: "Partners — early conversations, not a programme yet",
	description:
		"Aloha is in 0.x beta. There's no formal partner programme yet — but we want to talk to agencies, tool builders, and consultants now, before we design one.",
	path: routes.connect.partners,
	image: `${SITE_URL}/opengraph-image`,
});

const SHAPES = [
	{
		title: "Agencies",
		icon: Building,
		for: "Running social for multiple clients",
		body: "We don't have agency pricing, multi-workspace, or white-label reports yet. We'd like to build them with a handful of agencies who'll actually use them. If that's you, tell us how you work and what would make Aloha viable for your client book.",
	},
	{
		title: "Integrations",
		icon: Puzzle,
		for: "Tools that could fit alongside Aloha",
		body: "There's no public API yet. Integration priorities today are driven by what customers ask for most, and we'd rather have a conversation than a directory listing. If your tool overlaps with publishing, inbox, analytics, or capture — reach out.",
	},
	{
		title: "Consultants",
		icon: Users,
		for: "Implementing social tooling for clients",
		body: "No formal solution-partner track, no certification, no referral structure — not yet. We'd like to meet people doing this work so those things get designed around reality, not assumptions. Introduce yourself and tell us what you'd want from us.",
	},
];

export default function PartnersPage() {
	return (
		<>
			{/* ─── HERO ────────────────────────────────────────────────────── */}
			<header className="relative overflow-hidden bg-peach-200 pb-16 lg:pb-20">
				<span
					aria-hidden
					className="absolute top-[14%] left-[5%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none"
				>
					✳
				</span>
				<span
					aria-hidden
					className="absolute top-[68%] right-[10%] font-display text-[22px] text-primary/55 rotate-14 select-none"
				>
					+
				</span>
			</header>

			<section className="bg-peach-200 wavy">
				<div className="relative max-w-[1180px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32 lg:pb-40">
					<div className="grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-12 items-end">
						<div className="col-span-12 lg:col-span-8">
							<div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
								Partners · early days
							</div>
							<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[92px]">
								No programme yet.
								<br />
								<span className="text-primary font-light">
									Just a door that's open.
								</span>
							</h1>
							<p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
								Aloha is in 0.x beta. We haven't designed a partner programme,
								signed integration partners, or built a directory — and we'd
								rather say that plainly than ship a brochure. If you're an
								agency, a tool, or a consultant who sees an overlap, write to
								us. We'll reply as a person.
							</p>
						</div>
						<div className="col-span-12 flex flex-col items-end lg:col-span-4">
							<a
								href="mailto:hello@usealoha.app"
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full bg-ink text-background text-[15px] font-medium hover:bg-primary transition-colors self-end"
							>
								<Handshake className="w-4 h-4" />
								Start a conversation
							</a>
							<a
								href="mailto:hello@usealoha.app"
								className="mt-4 inline-flex items-center gap-2 text-[14px] font-medium text-ink pencil-link"
							>
								hello@usealoha.app
								<ArrowUpRight className="w-4 h-4" />
							</a>
						</div>
					</div>
				</div>
			</section>

			{/* ─── THREE SHAPES ────────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-24 lg:py-32 pb-32 lg:pb-40 wavy bg-background">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10">
						<div className="mb-14">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								Who we want to hear from
							</p>
							<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
								Three kinds of people,
								<br />
								<span className="text-primary">one inbox.</span>
							</h2>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
							{SHAPES.map((s) => (
								<article
									key={s.title}
									className="p-8 lg:p-9 rounded-3xl bg-peach-100 flex flex-col"
								>
									<s.icon className="w-6 h-6 text-ink" />
									<p className="mt-6 text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55">
										{s.for}
									</p>
									<h3 className="mt-2 font-display text-[28px] leading-[1.15] tracking-[-0.01em]">
										{s.title}
									</h3>
									<p className="mt-5 text-[14px] text-ink/80 leading-[1.6] flex-1">
										{s.body}
									</p>
									<a
										href="mailto:hello@usealoha.app"
										className="mt-7 pencil-link text-[13.5px] font-medium text-ink inline-flex items-center gap-2 self-start"
									>
										Write to us
										<ArrowUpRight className="w-3.5 h-3.5" />
									</a>
								</article>
							))}
						</div>
					</div>
				</section>
			</section>

			{/* ─── WHERE WE ARE ────────────────────────────────────────────── */}
			<section className="py-20 lg:py-24 bg-background-elev wavy">
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-16 items-start">
					<div className="col-span-12 lg:col-span-5">
						<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
							Where we actually are
						</p>
						<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
							Small team,
							<br />
							<span className="text-primary">shipping in public.</span>
						</h2>
					</div>

					<ul className="col-span-12 lg:col-span-7 space-y-6 text-[15.5px] leading-[1.7] text-ink/85">
						{[
							{
								h: "0.x beta, pricing not live yet",
								p: "Aloha is free to use right now while we settle tiers on Polar. Anything we'd offer a partner on pricing needs pricing to exist first.",
							},
							{
								h: "No public API, no integration SDK",
								p: "We publish to the channels we've shipped — Meta, Medium, and Snapchat are on the roadmap, not in production. An integration partnership today is a conversation, not a technical pipeline.",
							},
							{
								h: "No agency features yet",
								p: "Multi-workspace, client-facing reports, and role-based access are things we'd build with agencies, not ahead of them. Talking early helps us get them right.",
							},
							{
								h: "One person replies to partners@",
								p: "No forms routed into the void. Expect a real reply, possibly a slow one, from someone on the team.",
							},
						].map((x) => (
							<li
								key={x.h}
								className="pl-6 border-l-2 border-border-strong/60"
							>
								<p className="font-display text-[20px] leading-[1.2] tracking-[-0.005em] text-ink">
									{x.h}
								</p>
								<p className="mt-2 text-[14.5px] text-ink/70 leading-[1.6]">
									{x.p}
								</p>
							</li>
						))}
					</ul>
				</div>
			</section>

			{/* ─── WHAT WE LOOK FOR ────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-24 lg:py-32 pb-32 lg:pb-40 wavy bg-background">
					<div className="max-w-[1180px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-16 items-start">
						<div className="col-span-12 lg:col-span-5">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
								What we look for
							</p>
							<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
								Taste, patience,
								<br />
								<span className="text-primary">
									and honesty about fit.
								</span>
							</h2>
						</div>

						<ul className="col-span-12 lg:col-span-7 space-y-6 text-[15.5px] leading-[1.7] text-ink/85">
							{[
								{
									h: "You work with creators and small teams",
									p: "That's who Aloha is built for. If your book is enterprise-only, we're probably not a fit today — and it's kinder to say so.",
								},
								{
									h: "You're comfortable with early-stage",
									p: "Things will change. Features will move. A partner today is someone who wants to shape what gets built, not someone who needs it finished.",
								},
								{
									h: "Named contact on both sides",
									p: "Partnerships are human. We want a person, not a ticket queue. You'll get the same from us.",
								},
							].map((x) => (
								<li
									key={x.h}
									className="pl-6 border-l-2 border-border-strong/60"
								>
									<p className="font-display text-[20px] leading-[1.2] tracking-[-0.005em] text-ink">
										{x.h}
									</p>
									<p className="mt-2 text-[14.5px] text-ink/70 leading-[1.6]">
										{x.p}
									</p>
								</li>
							))}
						</ul>
					</div>
				</section>
			</section>

			{/* ─── WRITE TO US ─────────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section
					id="write"
					className="py-24 lg:py-32 pb-32 lg:pb-40 wavy bg-background-elev"
				>
					<div className="max-w-[820px] mx-auto px-6 lg:px-10 text-center">
						<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
							Write to us
						</p>
						<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
							No form. No funnel.
							<br />
							<span className="text-primary">Just an email address.</span>
						</h2>
						<p className="mt-8 text-[16px] lg:text-[17px] text-ink/75 leading-[1.6]">
							Tell us who you are, what you do, and what an Aloha
							partnership might look like from your side. Links beat pitch
							decks. A paragraph is plenty.
						</p>
						<div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
							<a
								href="mailto:hello@usealoha.app"
								className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-ink text-background font-medium text-[14px] hover:bg-primary transition-colors"
							>
								hello@usealoha.app
								<ArrowRight className="w-4 h-4" />
							</a>
						</div>
					</div>
				</section>
			</section>

			{/* ─── FINAL CTA ───────────────────────────────────────────────── */}
			<section className="relative overflow-hidden bg-ink wavy text-background-elev">
				<div
					aria-hidden
					className="absolute inset-0 opacity-10 -z-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1180px] mx-auto px-6 lg:px-10 py-20 lg:py-28 pb-32 lg:pb-40">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-end">
						<div className="col-span-12 lg:col-span-8">
							<h2 className="font-display text-[36px] sm:text-[48px] lg:text-[64px] leading-none tracking-[-0.02em]">
								Running an agency or tool?
								<br />
								<span className="text-peach-300">
									Let's talk, early.
								</span>
							</h2>
						</div>
						<div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:items-end">
							<a
								href="mailto:hello@usealoha.app"
								className="inline-flex items-center gap-2 h-14 px-7 rounded-full text-background font-medium text-[15px] bg-primary transition-colors"
							>
								<Sparkle className="w-4 h-4" />
								Write us
								<ArrowUpRight className="w-4 h-4" />
							</a>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
