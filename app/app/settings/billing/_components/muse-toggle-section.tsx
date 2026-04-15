"use client";

import { Sparkle } from "lucide-react";
import { useMemo, useState } from "react";
import { previewChange } from "@/lib/billing/preview";
import { InlineReview } from "./inline-review";

type Props = {
	enabled: boolean;
	channels: number;
	interval: "month" | "year";
	currentPeriodEndISO: string | null;
};

export function MuseToggleSection(props: Props) {
	const [reviewing, setReviewing] = useState(false);

	const preview = useMemo(() => {
		if (!reviewing) return null;
		return previewChange({
			current: {
				plan: props.enabled ? "basic_muse" : "basic",
				channels: props.channels,
				interval: props.interval,
				currentPeriodEnd: props.currentPeriodEndISO
					? new Date(props.currentPeriodEndISO)
					: null,
			},
			next: {
				plan: props.enabled ? "basic" : "basic_muse",
				channels: props.channels,
				interval: props.interval,
			},
		});
	}, [reviewing, props]);

	return (
		<section
			id="muse"
			className="rounded-3xl border border-border bg-background-elev overflow-hidden"
		>
			<div className="p-6 lg:p-8">
				<div className="grid md:grid-cols-[260px_1fr] gap-6 items-center">
					<div>
						<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 inline-flex items-center gap-2">
							<Sparkle className="w-3 h-3 text-primary" />
							Muse add-on
						</p>
						<h3 className="mt-1.5 font-display text-[20px] leading-[1.15] tracking-[-0.01em] text-ink">
							{props.enabled ? "Muse is active." : "Add Muse to your plan."}
						</h3>
						<p className="mt-2 text-[12.5px] text-ink/60 leading-normal">
							{props.enabled
								? "Style-trained voice and advanced campaigns are unlocked across your channels. Review any change before it's charged."
								: "Switch to the Basic + Muse plan. You'll see the prorated amount before anything is billed."}
						</p>
					</div>
					<div className="flex justify-end">
						<button
							type="button"
							onClick={() => setReviewing(true)}
							disabled={reviewing}
							className={
								props.enabled
									? "inline-flex items-center gap-2 h-11 px-5 rounded-full text-[13px] text-ink/65 hover:text-primary-deep hover:bg-peach-100/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
									: "inline-flex items-center gap-2 h-11 px-5 rounded-full bg-primary text-primary-foreground text-[13.5px] font-medium hover:bg-primary-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
							}
						>
							<Sparkle className="w-3.5 h-3.5" />
							{props.enabled ? "Review: Remove Muse" : "Review: Add Muse"}
						</button>
					</div>
				</div>
			</div>

			{reviewing && preview ? (
				<InlineReview
					preview={preview}
					proposedChannels={props.channels}
					proposedMuse={!props.enabled}
					onCancel={() => setReviewing(false)}
				/>
			) : null}
		</section>
	);
}
