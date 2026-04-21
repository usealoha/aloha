import { Eye } from "lucide-react";
import Link from "next/link";
import {
	BlueskyIcon,
	FacebookIcon,
	InstagramIcon,
	LinkedInIcon,
	MediumIcon,
	TikTokIcon,
	XIcon,
} from "@/app/auth/_components/provider-icons";

const PROVIDER_LABELS: Record<string, string> = {
	twitter: "X",
	linkedin: "LinkedIn",
	facebook: "Facebook",
	instagram: "Instagram",
	tiktok: "TikTok",
	bluesky: "Bluesky",
	medium: "Medium",
};

const PROVIDER_ICONS: Record<
	string,
	React.ComponentType<{ className?: string }>
> = {
	twitter: XIcon,
	linkedin: LinkedInIcon,
	facebook: FacebookIcon,
	instagram: InstagramIcon,
	tiktok: TikTokIcon,
	bluesky: BlueskyIcon,
	medium: MediumIcon,
};

function formatCompact(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 10_000) return `${(n / 1_000).toFixed(0)}K`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return n.toLocaleString();
}

interface ReachCardProps {
	totalImpressions: number;
	perPlatform: Array<{
		platform: string;
		impressions: number;
		posts: number;
		gated: boolean;
	}>;
	gatedConnectedCount: number;
}

export function ReachCard({
	totalImpressions,
	perPlatform,
	gatedConnectedCount,
}: ReachCardProps) {
	const hasAnyData =
		totalImpressions > 0 || perPlatform.some((p) => p.posts > 0);
	const totalPosts = perPlatform.reduce((sum, p) => sum + p.posts, 0);
	const active = perPlatform.filter((p) => !p.gated);
	const maxImpressions = Math.max(
		1,
		...active.map((p) => p.impressions),
	);

	return (
		<article className="rounded-2xl border border-border bg-background-elev p-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
						How far your posts went
					</p>
					<p className="mt-3 flex items-baseline gap-1.5">
						<span className="font-display text-[32px] leading-none tracking-[-0.02em] text-ink">
							{hasAnyData ? formatCompact(totalImpressions) : "—"}
						</span>
						<span className="text-[13px] text-ink/60">
							{hasAnyData ? "impressions" : ""}
						</span>
					</p>
					<p className="mt-1 text-[12px] text-ink/55">
						{hasAnyData
							? `over the last 7 days · ${totalPosts} post${totalPosts === 1 ? "" : "s"}`
							: "syncing nightly — check back tomorrow"}
					</p>
				</div>
				<span className="w-10 h-10 rounded-full bg-peach-100 border border-border grid place-items-center shrink-0">
					<Eye className="w-4 h-4 text-ink" />
				</span>
			</div>

			{perPlatform.length > 0 ? (
				<ul className="mt-5 space-y-3">
					{perPlatform.map((p) => {
						const Icon = PROVIDER_ICONS[p.platform];
						const label = PROVIDER_LABELS[p.platform] ?? p.platform;
						const share = p.gated
							? 0
							: Math.round((p.impressions / maxImpressions) * 100);
						return (
							<li key={p.platform} className="text-[12.5px]">
								<div className="flex items-center justify-between gap-3">
									<span className="inline-flex items-center gap-2 text-ink/80 min-w-0">
										{Icon ? <Icon className="w-3.5 h-3.5 shrink-0" /> : null}
										<span className="truncate">{label}</span>
									</span>
									<span className="text-ink/55 tabular-nums shrink-0">
										{p.gated
											? "awaiting approval"
											: p.posts === 0
												? "no posts yet"
												: `${formatCompact(p.impressions)} · ${p.posts} post${p.posts === 1 ? "" : "s"}`}
									</span>
								</div>
								<div className="mt-1.5 h-1 rounded-full bg-muted/60 overflow-hidden">
									<div
										className="h-full bg-ink/70 rounded-full transition-all"
										style={{ width: `${p.gated ? 0 : share}%` }}
									/>
								</div>
							</li>
						);
					})}
				</ul>
			) : null}

			{gatedConnectedCount > 0 ? (
				<p className="mt-5 text-[11.5px] text-ink/50 leading-[1.55]">
					{gatedConnectedCount} channel{gatedConnectedCount === 1 ? "" : "s"}{" "}
					waiting on platform approval. We&apos;ll backfill once it lands.
				</p>
			) : null}

			<Link
				href="/app/analytics"
				className="mt-5 inline-flex items-center justify-center w-full h-10 rounded-full border border-border-strong text-[13px] text-ink hover:border-ink transition-colors"
			>
				See full analytics
			</Link>
		</article>
	);
}
