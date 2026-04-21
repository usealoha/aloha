import { Rss } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FeedSource {
	id: string;
	title: string;
	iconUrl: string | null;
	siteUrl: string | null;
}

interface FeedDigestCardProps {
	unread: number;
	total: number;
	items: Array<{
		id: string;
		title: string;
		url: string | null;
		publishedAt: Date | null;
		feedTitle: string;
		isRead: boolean;
	}>;
	sources: FeedSource[];
}

function timeAgo(d: Date): string {
	const secs = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
	if (secs < 60) return `${secs}s`;
	const mins = Math.floor(secs / 60);
	if (mins < 60) return `${mins}m`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h`;
	const days = Math.floor(hrs / 24);
	if (days < 7) return `${days}d`;
	const weeks = Math.floor(days / 7);
	if (weeks < 5) return `${weeks}w`;
	return `${Math.floor(days / 30)}mo`;
}

function initial(title: string): string {
	return title.trim().charAt(0).toUpperCase() || "·";
}

export function FeedDigestCard({
	unread,
	total,
	items,
	sources,
}: FeedDigestCardProps) {
	const visibleSources = sources.slice(0, 6);
	const extraSources = Math.max(0, sources.length - visibleSources.length);
	const headline =
		unread > 0
			? `${unread} unread`
			: total > 0
				? "All caught up"
				: "No items yet";
	const subline =
		sources.length > 0
			? `from ${sources.length} source${sources.length === 1 ? "" : "s"}`
			: "across your reader";

	return (
		<article className="rounded-2xl border border-border bg-background-elev p-6">
			<div>
				<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
					Feeds
				</p>
				<p className="mt-1.5 font-display text-[20px] leading-[1.15] text-ink">
					{headline}
				</p>
				<p className="mt-0.5 text-[12px] text-ink/55">{subline}</p>
			</div>

			{visibleSources.length > 0 ? (
				<ul className="mt-4 flex items-center -space-x-1.5">
					{visibleSources.map((s) => (
						<li key={s.id} title={s.title}>
							<span
								className={cn(
									"flex items-center justify-center w-7 h-7 rounded-full",
									"border border-border bg-peach-100 ring-2 ring-background-elev",
									"text-[10px] font-semibold text-ink/70 overflow-hidden",
								)}
							>
								{s.iconUrl ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img
										src={s.iconUrl}
										alt=""
										className="w-full h-full object-cover"
									/>
								) : (
									initial(s.title)
								)}
							</span>
						</li>
					))}
					{extraSources > 0 ? (
						<li>
							<span className="flex items-center justify-center w-7 h-7 rounded-full border border-border bg-background text-[10px] text-ink/60 ring-2 ring-background-elev">
								+{extraSources}
							</span>
						</li>
					) : null}
					<li className="pl-3">
						<Rss className="w-3.5 h-3.5 text-ink/35" />
					</li>
				</ul>
			) : null}

			<ul className="mt-4 -mx-2 space-y-0.5">
				{items.map((item) => (
					<li key={item.id}>
						<a
							href={item.url ?? "#"}
							target="_blank"
							rel="noopener noreferrer"
							className="group relative flex items-start gap-2.5 px-2 py-2.5 rounded-lg hover:bg-muted/40 transition-colors"
						>
							<span
								className={cn(
									"mt-[7px] w-1.5 h-1.5 rounded-full shrink-0",
									item.isRead ? "bg-transparent" : "bg-primary",
								)}
								aria-hidden
							/>
							<div className="flex-1 min-w-0">
								<p
									className={cn(
										"text-[13px] leading-[1.4] line-clamp-2 transition-colors group-hover:text-ink",
										item.isRead ? "text-ink/60" : "text-ink font-medium",
									)}
								>
									{item.title}
								</p>
								<p className="mt-1 flex items-center gap-1.5 text-[11px] text-ink/50 min-w-0">
									<span className="truncate">{item.feedTitle}</span>
									{item.publishedAt ? (
										<>
											<span aria-hidden className="text-ink/30">·</span>
											<span className="tabular-nums shrink-0">
												{timeAgo(item.publishedAt)}
											</span>
										</>
									) : null}
								</p>
							</div>
						</a>
					</li>
				))}
			</ul>
			<Link
				href="/app/feeds"
				className="mt-5 inline-flex items-center justify-center w-full h-10 rounded-full border border-border-strong text-[13px] text-ink hover:border-ink transition-colors"
			>
				<Rss className="w-3.5 h-3.5 mr-1.5" />
				Open reader
			</Link>
		</article>
	);
}
