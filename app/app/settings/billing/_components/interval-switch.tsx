"use client";

import { CalendarClock } from "lucide-react";
import { useMemo, useState } from "react";
import { previewChange } from "@/lib/billing/preview";
import { InlineReview } from "./inline-review";

type Props = {
	interval: "month" | "year";
	channels: number;
	museEnabled: boolean;
	currentPeriodEndISO: string | null;
};

export function IntervalSwitch(props: Props) {
	const [reviewing, setReviewing] = useState(false);
	const nextInterval: "month" | "year" =
		props.interval === "year" ? "month" : "year";

	const preview = useMemo(() => {
		if (!reviewing) return null;
		return previewChange({
			current: {
				plan: props.museEnabled ? "basic_muse" : "basic",
				channels: props.channels,
				interval: props.interval,
				currentPeriodEnd: props.currentPeriodEndISO
					? new Date(props.currentPeriodEndISO)
					: null,
			},
			next: {
				plan: props.museEnabled ? "basic_muse" : "basic",
				channels: props.channels,
				interval: nextInterval,
			},
		});
	}, [reviewing, nextInterval, props]);

	const switchingToYearly = nextInterval === "year";

	return (
		<section
			id="interval"
			className="rounded-3xl border border-border bg-background-elev overflow-hidden"
		>
			<div className="p-6 lg:p-8">
				<div className="grid md:grid-cols-[260px_1fr] gap-6 items-center">
					<div>
						<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 inline-flex items-center gap-2">
							<CalendarClock className="w-3.5 h-3.5 text-primary" />
							Billing interval
						</p>
						<h3 className="mt-1.5 font-display text-[20px] leading-[1.15] tracking-[-0.01em] text-ink">
							{switchingToYearly
								? "Switch to yearly — save 20%."
								: "Switch to monthly."}
						</h3>
						<p className="mt-2 text-[12.5px] text-ink/60 leading-normal">
							{switchingToYearly
								? "Pay once a year instead of twelve. You'll see the prorated balance before anything changes."
								: "More flexibility, no yearly commitment. Prorated against the time already paid on your yearly plan."}
						</p>
					</div>
					<div className="flex justify-end">
						<button
							type="button"
							onClick={() => setReviewing(true)}
							disabled={reviewing}
							className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-ink text-background text-[13.5px] font-medium hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
						>
							<CalendarClock className="w-3.5 h-3.5" />
							Review: switch to {nextInterval === "year" ? "yearly" : "monthly"}
						</button>
					</div>
				</div>
			</div>

			{reviewing && preview ? (
				<InlineReview
					preview={preview}
					proposedChannels={props.channels}
					proposedMuse={props.museEnabled}
					proposedInterval={nextInterval}
					onCancel={() => setReviewing(false)}
				/>
			) : null}
		</section>
	);
}
