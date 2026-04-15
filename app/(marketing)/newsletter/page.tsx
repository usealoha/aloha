import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import { ArrowRight, Clock, FileText, Mail } from "lucide-react";
import Link from "next/link";

export const metadata = makeMetadata({
	title: "Newsletter — one email on Fridays, no upsell",
	description:
		"A weekly note from Aloha. What shipped, what I'm reading, and one short essay. Launching shortly after the product — drop your email to get the first issue.",
	path: routes.connect.newsletter,
});

export default function NewsletterPage() {
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
				<span
					aria-hidden
					className="absolute top-[28%] right-[6%] font-display text-[38px] text-ink/15 rotate-18 select-none"
				>
					※
				</span>
			</header>

			<section className="bg-peach-200 wavy">
				<div className="relative max-w-[1180px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32 lg:pb-40">
					<div className="inline-flex items-center gap-2 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
						Newsletter
					</div>
					<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
						One email,
						<br />
						<span className="text-primary font-light">coming soon.</span>
					</h1>
					<p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
						The Aloha newsletter launches shortly after the product does.
						What shipped, what I didn't get to, and one short essay on the
						quiet shape of good tools. Drop your email and the first issue
						lands in your inbox.
					</p>

					{/* subscribe form */}
					<form
						action="#"
						method="post"
						className="mt-12 flex flex-col sm:flex-row gap-3 max-w-xl"
					>
						<div className="relative flex-1">
							<Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-ink/45" />
							<input
								type="email"
								name="email"
								required
								placeholder="you@wherever.works"
								className="w-full h-14 pl-11 pr-5 rounded-full bg-background-elev border border-border-strong text-[15px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
							/>
						</div>
						<button
							type="submit"
							className="inline-flex items-center justify-center gap-2 h-14 px-7 rounded-full bg-ink text-background font-medium text-[15px] hover:bg-primary transition-colors"
						>
							Subscribe
							<ArrowRight className="w-4 h-4" />
						</button>
					</form>
					<p className="mt-4 text-[12.5px] text-ink/55 max-w-xl">
						Free forever. One click to unsubscribe. By joining you accept the{" "}
						<Link
							href={routes.legal.privacy}
							className="pencil-link text-ink/70"
						>
							privacy policy
						</Link>
						.
					</p>

					<div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-ink/60">
						<span className="inline-flex items-center gap-2">
							<Clock className="w-3.5 h-3.5 text-primary" />
							Planned cadence: every Friday, 9am IST
						</span>
					</div>
				</div>
			</section>

			{/* ─── WHAT YOU'LL GET ─────────────────────────────────────────── */}
			<section className="bg-background-elev">
				<section className="py-24 lg:py-32 pb-32 lg:pb-40 wavy bg-background">
					<div className="max-w-[1100px] mx-auto px-6 lg:px-10">
						<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-10 mb-14 items-end">
							<div className="col-span-12 lg:col-span-7">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
									What you'll get
								</p>
								<h2 className="font-display text-[36px] lg:text-[52px] leading-[1.02] tracking-[-0.02em]">
									Three things,
									<br />
									<span className="text-primary">every Friday.</span>
								</h2>
							</div>
							<p className="col-span-12 lg:col-span-5 text-[15.5px] text-ink/70 leading-[1.55]">
								No drip sequence. No welcome-email-series-of-five. One issue a
								week, consistently, for as long as you let us.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
							{[
								{
									h: "A short essay",
									p: "600–1200 words on something we've been thinking about — product craft, creator economy, the quiet shape of good tools.",
									tone: "bg-peach-100",
								},
								{
									h: "What shipped",
									p: "Two or three sentences on what went live that week. If nothing did, we'll say so plainly.",
									tone: "bg-peach-200",
								},
								{
									h: "A link trail",
									p: "Five things we read that earned the link. No newsletter-swap, no affiliate, just the good stuff.",
									tone: "bg-primary-soft",
								},
							].map((f) => (
								<article
									key={f.h}
									className={`p-8 rounded-3xl ${f.tone} flex flex-col min-h-[220px]`}
								>
									<FileText className="w-6 h-6 text-ink" />
									<h3 className="mt-6 font-display text-[22px] leading-[1.2] tracking-[-0.005em]">
										{f.h}
									</h3>
									<p className="mt-3 text-[14px] text-ink/75 leading-[1.6]">
										{f.p}
									</p>
								</article>
							))}
						</div>
					</div>
				</section>
			</section>

			{/* ─── WHO WRITES IT ─────────────────────────────────────────── */}
			<section className="bg-ink relative">
				<div
					aria-hidden
					className="absolute inset-0 opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<section className="py-24 lg:py-32 pb-32 lg:pb-40 wavy bg-background">
					<div className="max-w-[1100px] mx-auto px-6 lg:px-10">
						<div className="grid grid-cols-12 gap-x-0 gap-y-10 lg:gap-16 items-center">
							<div className="col-span-12 lg:col-span-7">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
									Who writes it
								</p>
								<h2 className="font-display text-[36px] lg:text-[48px] leading-[1.02] tracking-[-0.02em]">
									One person,
									<br />
									<span className="text-primary">every Friday.</span>
								</h2>
								<p className="mt-6 text-[15.5px] text-ink/75 leading-[1.6] max-w-xl">
									Aloha is an indie, one-person project out of Bengaluru.
									The same person writing the code writes the newsletter —
									so the posts and the product stay honest about each other.
								</p>

								<Link
									href={routes.company.about}
									className="mt-8 pencil-link inline-flex items-center gap-2 text-[14.5px] font-medium text-ink"
								>
									More about Aloha
									<ArrowRight className="w-4 h-4" />
								</Link>
							</div>
						</div>
					</div>
				</section>
			</section>

			{/* ─── FINAL CTA ──────────────────────────────────────────────── */}
			<section className="relative overflow-hidden bg-ink wavy text-background-elev">
				<div
					aria-hidden
					className="absolute inset-0 opacity-10 bg-[radial-gradient(var(--peach-300)_1px,transparent_1px)] bg-size-[28px_28px]"
				/>
				<div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-20 lg:py-28 pb-32 lg:pb-40">
					<div className="p-10 lg:p-14 rounded-3xl bg-ink text-background-elev">
						<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-peach-200 mb-5">
							In 10 seconds
						</p>
						<p className="font-display text-[32px] lg:text-[44px] leading-[1.1] tracking-[-0.015em] max-w-3xl">
							One email a week. No push. No drip. One unsubscribe link. Start
							reading;{" "}
							<span className="text-peach-300">stay as long as it earns.</span>
						</p>
						<form
							action="#"
							method="post"
							className="mt-10 flex flex-col sm:flex-row gap-3 max-w-xl"
						>
							<input
								type="email"
								required
								placeholder="you@wherever.works"
								className="w-full h-12 px-5 rounded-full bg-background-elev/10 border border-peach-200/20 text-[14px] text-background-elev placeholder:text-background-elev/40 focus:outline-none focus:border-peach-300"
							/>
							<button
								type="submit"
								className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-peach-300 text-ink font-medium text-[14px] hover:bg-peach-400 transition-colors shrink-0"
							>
								Subscribe
								<ArrowRight className="w-4 h-4" />
							</button>
						</form>
					</div>
				</div>
			</section>
		</>
	);
}
