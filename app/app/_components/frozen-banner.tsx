import Link from "next/link";
import { Snowflake } from "lucide-react";

// Top-of-layout banner shown whenever the active workspace is frozen.
// Frozen = owner is over their workspace add-on seat allowance, so we've
// paused publish + invite flows until they either buy a seat back or
// delete another workspace. Read-only browsing still works.
export function FrozenBanner({ isOwner }: { isOwner: boolean }) {
	return (
		<div className="border-b border-border bg-peach-100/70">
			<div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-3 flex flex-wrap items-center gap-3 text-[13px]">
				<span className="grid place-items-center w-6 h-6 rounded-full bg-background">
					<Snowflake className="w-3.5 h-3.5 text-ink" />
				</span>
				<div className="min-w-0 flex-1">
					<span className="font-medium text-ink">This workspace is frozen.</span>
					<span className="text-ink/70">
						{" "}
						{isOwner
							? "You're over your seat allowance. Add a workspace seat to restore it, or delete a workspace to free one up."
							: "The owner is over their seat allowance. Publishing and invites are paused until they resolve it."}
					</span>
				</div>
				{isOwner ? (
					<Link
						href="/app/settings/billing#workspaces"
						className="inline-flex items-center h-8 px-4 rounded-full bg-ink text-background text-[12.5px] font-medium hover:bg-primary transition-colors shrink-0"
					>
						Fix billing
					</Link>
				) : null}
			</div>
		</div>
	);
}
