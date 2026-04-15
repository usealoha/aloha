import { routes } from "@/lib/routes";
import { makeMetadata } from "@/lib/seo";
import { ArrowUpRight, Mail } from "lucide-react";
import Link from "next/link";

export const metadata = makeMetadata({
	title: "Status — coming soon",
	description:
		"A live status page for Aloha is on the way. Until then, write us if something looks off.",
	path: routes.resources.status,
});

export default function StatusPage() {
	return (
		<>
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
							<div className="inline-flex items-center gap-3 mb-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
								<span className="w-6 h-px bg-ink/40" />
								Status
							</div>
							<h1 className="font-display font-normal text-ink leading-[0.95] tracking-[-0.03em] text-[56px] sm:text-[72px] lg:text-[96px]">
								Status page
								<br />
								<span className="text-primary font-light">coming soon.</span>
							</h1>
							<p className="mt-8 max-w-2xl text-[17px] lg:text-[18px] leading-[1.6] text-ink/75">
								We're building a live system-health page with uptime history
								and incident post-mortems. Until it ships, the inbox below is
								the fastest way to reach us if something looks off.
							</p>
						</div>
						<div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
							<a
								href="mailto:hello@usealoha.app?subject=Something%20looks%20off"
								className="inline-flex items-center gap-2 h-12 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
							>
								<Mail className="w-4 h-4" />
								Report a problem
							</a>
							<Link
								href={routes.company.contact}
								className="pencil-link inline-flex items-center gap-2 text-[13.5px] font-medium text-ink"
							>
								Other ways to reach us
								<ArrowUpRight className="w-3.5 h-3.5" />
							</Link>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
