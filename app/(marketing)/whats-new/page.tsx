import { RELEASES, type ChangeTag, type Release } from "@/lib/releases";
import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import {
	ArrowRight,
	ArrowUpRight,
	Bug,
	Rss,
	Sparkle,
	Wrench,
	type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { ScreenshotPlaceholder } from "../_components/screenshot-placeholder";

export const metadata = makeMetadata({
	title: "What's new — every update, in order",
	description:
		"The Aloha changelog. Every shipped feature, improvement, and fix, dated honestly and written in plain English.",
	path: routes.product.whatsNew,
});

const TAG_META: Record<
	ChangeTag,
	{ label: string; icon: LucideIcon; dot: string; text: string }
> = {
	new: {
		label: "New",
		icon: Sparkle,
		dot: "bg-primary",
		text: "text-primary",
	},
	improved: {
		label: "Improved",
		icon: Wrench,
		dot: "bg-ink",
		text: "text-ink",
	},
	fixed: {
		label: "Fixed",
		icon: Bug,
		dot: "bg-ink/50",
		text: "text-ink/70",
	},
};

const TAG_ORDER: ChangeTag[] = ["new", "improved", "fixed"];

function groupChanges(release: Release) {
	const groups: Record<ChangeTag, string[]> = {
		new: [],
		improved: [],
		fixed: [],
	};
	for (const c of release.changes) groups[c.tag].push(c.t);
	return groups;
}

export default function WhatsNewPage() {
	const [latest, ...rest] = RELEASES;
	const latestGroups = groupChanges(latest);

	return (
		<>
			{/* ─── HERO ────────────────────────────────────────────────────── */}
			<header className="relative overflow-hidden bg-peach-200 pb-16 lg:pb-20">
				<span
					aria-hidden
					className="absolute top-[18%] left-[5%] font-display text-[28px] text-ink/25 rotate-[-8deg] select-none"
				>
					✳
				</span>
				<span
					aria-hidden
					className="absolute top-[68%] right-[10%] font-display text-[22px] text-primary/55 rotate-14 select-none"
				>
					+
				</span>
				<span
					aria-hidden
					className="absolute top-[34%] right-[6%] font-display text-[36px] text-ink/15 rotate-18 select-none"
				>
					※
				</span>
			</header>

			<section className="bg-peach-200 wavy">
				<div className="relative max-w-[1100px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-20 lg:pb-28">
					<div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
						<div>
							<div className="inline-flex items-center gap-3 mb-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
								<span className="w-6 h-px bg-ink/40" />
								Changelog
							</div>
							<h1 className="font-display font-normal text-ink leading-[0.98] tracking-[-0.03em] text-[56px] sm:text-[68px] lg:text-[88px]">
								What's shipped,
								<br />
								<span className="text-primary font-light">in order.</span>
							</h1>
							<p className="mt-8 max-w-xl text-[16px] lg:text-[17px] leading-[1.55] text-ink/70">
								Every release, dated honestly and written in English. No
								"exciting news," no "we're thrilled to announce." Just what
								changed, and why you'd care.
							</p>
						</div>
						<div className="flex items-center gap-3 shrink-0">
							<a
								href="/feed.xml"
								className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-background-elev border border-border-strong text-[13px] font-medium hover:bg-muted transition-colors"
							>
								<Rss className="w-4 h-4" />
								Atom feed
							</a>
							<Link
								href={routes.product.roadmap}
								className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
							>
								What's next
								<ArrowUpRight className="w-3.5 h-3.5" />
							</Link>
						</div>
					</div>

					{/* release count strip */}
					<div className="mt-14 lg:mt-20 flex items-end justify-between border-t border-ink/15 pt-6">
						<div className="flex items-baseline gap-3">
							<span className="font-display text-[44px] lg:text-[56px] leading-none tracking-[-0.02em] text-ink">
								{RELEASES.length}
							</span>
							<span className="text-[12px] font-mono uppercase tracking-[0.22em] text-ink/55">
								releases
							</span>
						</div>
						<div className="text-right">
							<span className="block text-[11px] font-mono uppercase tracking-[0.22em] text-ink/55">
								Latest
							</span>
							<span className="mt-1 block text-[14px] font-display text-ink">
								v{latest.version} · {latest.dateLabel}
							</span>
						</div>
					</div>
				</div>
			</section>

			{/* ─── LATEST RELEASE ──────────────────────────────────────────── */}
			<section className="bg-background py-20 lg:py-28">
				<div className="max-w-[1100px] mx-auto px-6 lg:px-10">
					<div className="flex items-baseline justify-between mb-10">
						<h2 className="font-display text-[28px] lg:text-[36px] leading-[1.05] tracking-[-0.015em] text-ink">
							Latest
						</h2>
						<span className="text-[11px] font-mono uppercase tracking-[0.22em] text-ink/55">
							v{latest.version}
						</span>
					</div>

					<article className="rounded-3xl bg-primary-soft border border-primary/15 overflow-hidden">
						{latest.screenshotSrc && latest.screenshotLabel ? (
							<div className="grid grid-cols-12 gap-x-0 gap-y-8 lg:gap-12 p-8 lg:p-12">
								<div className="col-span-12 lg:col-span-5">
									<time
										dateTime={latest.date}
										className="block text-[11.5px] font-mono uppercase tracking-[0.22em] text-primary"
									>
										{latest.dateLabel}
									</time>
									<h3 className="mt-4 font-display text-[32px] lg:text-[40px] leading-[1.05] tracking-[-0.015em] text-ink">
										{latest.title}
									</h3>
									<p className="mt-5 text-[15px] leading-[1.6] text-ink/75 max-w-md">
										{latest.lead}
									</p>

									<div className="mt-8 space-y-6">
										{TAG_ORDER.map((tag) => {
											const items = latestGroups[tag];
											if (items.length === 0) return null;
											const meta = TAG_META[tag];
											const Icon = meta.icon;
											return (
												<div key={tag}>
													<div
														className={`flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] ${meta.text}`}
													>
														<Icon className="w-3 h-3" />
														{meta.label}
													</div>
													<ul className="mt-3 space-y-2.5">
														{items.map((t, i) => (
															<li
																key={i}
																className="flex items-start gap-3 text-[14px] text-ink/85 leading-[1.55]"
															>
																<span
																	aria-hidden
																	className={`mt-[7px] w-1.5 h-1.5 rounded-full ${meta.dot} shrink-0`}
																/>
																<span>{t}</span>
															</li>
														))}
													</ul>
												</div>
											);
										})}
									</div>
								</div>

								<div className="col-span-12 lg:col-span-7">
									<ScreenshotPlaceholder
										id={`release-${latest.version}`}
										label={latest.screenshotLabel}
										notes={latest.screenshotNotes ?? ""}
										aspect="aspect-[16/10]"
										tone="bg-background-elev"
										src={latest.screenshotSrc}
										alt={latest.screenshotAlt}
									/>
								</div>
							</div>
						) : (
							<div className="p-8 lg:p-12">
								<div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-8 mb-10 border-b border-primary/20">
									<div className="max-w-2xl">
										<time
											dateTime={latest.date}
											className="block text-[11.5px] font-mono uppercase tracking-[0.22em] text-primary"
										>
											{latest.dateLabel}
										</time>
										<h3 className="mt-4 font-display text-[32px] lg:text-[44px] leading-[1.05] tracking-[-0.015em] text-ink">
											{latest.title}
										</h3>
									</div>
									<p className="text-[15px] leading-[1.6] text-ink/75 max-w-sm lg:text-right">
										{latest.lead}
									</p>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
									{TAG_ORDER.map((tag) => {
										const items = latestGroups[tag];
										if (items.length === 0) return null;
										const meta = TAG_META[tag];
										const Icon = meta.icon;
										return (
											<div key={tag}>
												<div
													className={`flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] ${meta.text}`}
												>
													<Icon className="w-3 h-3" />
													{meta.label}
													<span className="ml-auto text-ink/40 font-mono">
														{String(items.length).padStart(2, "0")}
													</span>
												</div>
												<ul className="mt-4 space-y-3">
													{items.map((t, i) => (
														<li
															key={i}
															className="flex items-start gap-3 text-[14px] text-ink/85 leading-[1.55]"
														>
															<span
																aria-hidden
																className={`mt-[7px] w-1.5 h-1.5 rounded-full ${meta.dot} shrink-0`}
															/>
															<span>{t}</span>
														</li>
													))}
												</ul>
											</div>
										);
									})}
								</div>
							</div>
						)}
					</article>
				</div>
			</section>

			{/* ─── EARLIER RELEASES ────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 top-2.5! opacity-20 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="bg-background wavy pb-32 lg:pb-40">
					<div className="max-w-[1100px] mx-auto px-6 lg:px-10">
						<div className="flex items-baseline justify-between mb-10 lg:mb-14">
							<h2 className="font-display text-[28px] lg:text-[36px] leading-[1.05] tracking-[-0.015em] text-ink">
								Earlier
							</h2>
							<span className="text-[11px] font-mono uppercase tracking-[0.22em] text-ink/55">
								{rest.length} releases
							</span>
						</div>

						<ol className="space-y-8 lg:space-y-10">
							{rest.map((r) => {
								const groups = groupChanges(r);
								return (
									<li
										key={r.version}
										className="rounded-3xl bg-background-elev border border-border-strong/60 p-7 lg:p-10"
									>
										<div className="grid grid-cols-12 gap-x-0 gap-y-6 lg:gap-10">
											<div className="col-span-12 lg:col-span-3">
												<div className="flex items-center gap-3 lg:flex-col lg:items-start lg:gap-2">
													<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-peach-200 text-[10.5px] font-mono uppercase tracking-[0.2em] text-ink/70">
														v{r.version}
													</span>
													<time
														dateTime={r.date}
														className="text-[11.5px] font-mono uppercase tracking-[0.22em] text-ink/55"
													>
														{r.dateLabel}
													</time>
												</div>
											</div>

											<div className="col-span-12 lg:col-span-9">
												<h3 className="font-display text-[22px] lg:text-[26px] leading-[1.15] tracking-[-0.01em] text-ink">
													{r.title}
												</h3>
												<p className="mt-3 text-[14.5px] leading-[1.6] text-ink/75 max-w-2xl">
													{r.lead}
												</p>

												<div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
													{TAG_ORDER.map((tag) => {
														const items = groups[tag];
														if (items.length === 0) return null;
														const meta = TAG_META[tag];
														const Icon = meta.icon;
														return (
															<div key={tag}>
																<div
																	className={`flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] ${meta.text}`}
																>
																	<Icon className="w-3 h-3" />
																	{meta.label}
																</div>
																<ul className="mt-3 space-y-2">
																	{items.map((t, i) => (
																		<li
																			key={i}
																			className="flex items-start gap-2.5 text-[13.5px] text-ink/80 leading-[1.55]"
																		>
																			<span
																				aria-hidden
																				className={`mt-[7px] w-1 h-1 rounded-full ${meta.dot} shrink-0`}
																			/>
																			<span>{t}</span>
																		</li>
																	))}
																</ul>
															</div>
														);
													})}
												</div>
											</div>
										</div>
									</li>
								);
							})}
						</ol>
					</div>
				</section>
			</section>

			{/* ─── FOOTER CTA ──────────────────────────────────────────────── */}
			<section className="relative py-24 lg:py-28 bg-ink wavy text-background-elev">
				<div
					aria-hidden
					className="absolute inset-0 top-2! opacity-20 -z-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1100px] mx-auto px-6 lg:px-10">
					<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 items-center">
						<div className="col-span-12 lg:col-span-7">
							<h2 className="font-display text-[32px] lg:text-[44px] leading-[1.05] tracking-[-0.015em]">
								This is the honest list.
								<br />
								<span className="text-peach-300">Here's what's next.</span>
							</h2>
							<p className="mt-5 max-w-lg text-[15px] text-ink/70 leading-[1.6]">
								The roadmap is our working list of planned work. Dates are
								intentions, not promises — and what's on it shifts when real
								usage tells us something new.
							</p>
						</div>
						<div className="col-span-12 lg:col-span-5 flex flex-col gap-3 lg:items-end">
							<Link
								href={routes.product.roadmap}
								className="inline-flex items-center gap-2 h-12 px-6 rounded-full text-background text-[14px] font-medium bg-primary transition-colors"
							>
								See the roadmap
								<ArrowRight className="w-4 h-4" />
							</Link>
							<Link
								href={routes.resources.apiDocs}
								className="pencil-link text-[13.5px] font-medium inline-flex items-center gap-2"
							>
								API changes live in the docs
								<ArrowUpRight className="w-3.5 h-3.5" />
							</Link>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
