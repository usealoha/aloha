"use client";

import { ArrowUpRight, Plug } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { previewChange } from "@/lib/billing/preview";
import { InlineReview } from "./inline-review";

type Props = {
	current: number;
	connected: number;
	interval: "month" | "year";
	museEnabled: boolean;
	// ISO string so it crosses the server → client boundary cleanly.
	currentPeriodEndISO: string | null;
};

export function ChannelAdjuster(props: Props) {
	const [value, setValue] = useState(String(props.current));
	const [reviewing, setReviewing] = useState(false);

	const parsed = Number.parseInt(value, 10);
	const valid = Number.isFinite(parsed) && parsed >= 1 && parsed <= 1000;
	const changed = valid && parsed !== props.current;

	const preview = useMemo(() => {
		if (!reviewing || !changed) return null;
		return previewChange({
			current: {
				plan: props.museEnabled ? "basic_muse" : "basic",
				channels: props.current,
				interval: props.interval,
				currentPeriodEnd: props.currentPeriodEndISO
					? new Date(props.currentPeriodEndISO)
					: null,
			},
			next: {
				plan: props.museEnabled ? "basic_muse" : "basic",
				channels: parsed,
				interval: props.interval,
			},
		});
	}, [reviewing, changed, parsed, props]);

	return (
		<section
			id="channels"
			className="rounded-3xl border border-border bg-background-elev overflow-hidden"
		>
			<div className="p-6 lg:p-8">
				<div className="grid md:grid-cols-[260px_1fr] gap-6 items-start">
					<div>
						<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
							Channels
						</p>
						<h3 className="mt-1.5 font-display text-[20px] leading-[1.15] tracking-[-0.01em] text-ink">
							Adjust your billable count.
						</h3>
						<p className="mt-2 text-[12.5px] text-ink/60 leading-normal">
							You currently pay for {props.current}. {props.connected} channel
							{props.connected === 1 ? " is" : "s are"} connected.
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-3">
						<label
							htmlFor="channels-input"
							className="text-[12px] uppercase tracking-[0.18em] text-ink/55"
						>
							New count
						</label>
						<input
							id="channels-input"
							name="channels"
							type="number"
							min={1}
							max={1000}
							value={value}
							onChange={(e) => {
								setValue(e.target.value);
								if (reviewing) setReviewing(false);
							}}
							className="w-24 h-11 px-3 rounded-xl bg-background border border-border-strong text-[14px] text-ink text-center focus:outline-none focus:border-ink transition-colors"
						/>
						<button
							type="button"
							onClick={() => setReviewing(true)}
							disabled={!changed || reviewing}
							className="inline-flex items-center h-11 px-5 rounded-full bg-ink text-background text-[13.5px] font-medium hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-ink"
						>
							Review changes
						</button>
						<Link
							href="/app/settings/channels"
							className="inline-flex items-center gap-1.5 h-11 px-3 text-[12.5px] text-ink/60 hover:text-ink transition-colors"
						>
							<Plug className="w-3.5 h-3.5" />
							Manage channels
							<ArrowUpRight className="w-3 h-3" />
						</Link>
					</div>
				</div>
			</div>

			{reviewing && preview && valid ? (
				<InlineReview
					preview={preview}
					proposedChannels={parsed}
					proposedMuse={props.museEnabled}
					onCancel={() => {
						setReviewing(false);
						setValue(String(props.current));
					}}
				/>
			) : null}
		</section>
	);
}
