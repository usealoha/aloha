"use client";

import { CalendarClock, Sparkle } from "lucide-react";
import { useMemo, useState } from "react";
import { previewChange } from "@/lib/billing/preview";
import { InlineReview } from "./inline-review";

function formatMoney(n: number) {
	const r = Math.round(n * 100) / 100;
	return Number.isInteger(r) ? `${r}` : r.toFixed(2);
}

function formatDate(d: Date) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(d);
}

type Mode = "interval" | "muse" | null;

type Props = {
	plan: "basic" | "basic_muse";
	channels: number;
	interval: "month" | "year";
	museEnabled: boolean;
	perMonth: number;
	annualTotal: number;
	nextBilling: Date | null;
	cancelAtPeriodEnd: boolean;
	currentPeriodEndISO: string | null;
};

export function PlanSummary(props: Props) {
	const [mode, setMode] = useState<Mode>(null);
	const nextInterval: "month" | "year" =
		props.interval === "year" ? "month" : "year";

	const preview = useMemo(() => {
		if (!mode) return null;
		const currentPeriodEnd = props.currentPeriodEndISO
			? new Date(props.currentPeriodEndISO)
			: null;
		if (mode === "interval") {
			return previewChange({
				current: {
					plan: props.plan,
					channels: props.channels,
					interval: props.interval,
					currentPeriodEnd,
				},
				next: {
					plan: props.plan,
					channels: props.channels,
					interval: nextInterval,
				},
			});
		}
		return previewChange({
			current: {
				plan: props.plan,
				channels: props.channels,
				interval: props.interval,
				currentPeriodEnd,
			},
			next: {
				plan: props.museEnabled ? "basic" : "basic_muse",
				channels: props.channels,
				interval: props.interval,
			},
		});
	}, [mode, nextInterval, props]);

	return (
		<div className="rounded-3xl bg-background-elev border border-border overflow-hidden">
			<div className="px-8 lg:px-12 py-8 bg-peach-100 border-b border-border">
				<div className="flex flex-wrap items-start justify-between gap-6">
					<div>
						<p className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/60 mb-3 inline-flex items-center gap-2">
							{props.plan === "basic_muse" ? (
								<>
									<Sparkle className="w-3 h-3 text-primary" />
									Basic + Muse
								</>
							) : (
								"Basic"
							)}
							<span className="text-ink/40">·</span>
							<span>
								{props.interval === "year" ? "billed yearly" : "billed monthly"}
							</span>
						</p>
						<p className="font-display text-[48px] lg:text-[64px] leading-[0.95] tracking-[-0.025em]">
							${formatMoney(props.perMonth)}
							<span className="text-[18px] lg:text-[22px] text-ink/50 font-mono ml-3">
								/ mo
							</span>
						</p>
						<p className="mt-2 text-[13px] text-ink/65">
							{props.channels} channel{props.channels === 1 ? "" : "s"}
							{props.interval === "year" ? (
								<>
									<span className="text-ink/40"> · </span>
									<span className="font-mono">
										${Math.round(props.annualTotal).toLocaleString()} / yr
									</span>
								</>
							) : null}
						</p>
					</div>
					<div className="text-right">
						<p className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/55 mb-1">
							{props.cancelAtPeriodEnd ? "Cancels on" : "Renews on"}
						</p>
						<p className="font-display text-[22px] tracking-[-0.005em]">
							{props.nextBilling ? formatDate(props.nextBilling) : "—"}
						</p>
						<form action="/api/billing/portal" method="post" className="mt-2">
							<button
								type="submit"
								className="pencil-link text-[11.5px] text-ink/55 hover:text-ink font-medium"
							>
								Update payment method
							</button>
						</form>
					</div>
				</div>
			</div>

			<div className="px-8 lg:px-12 py-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px]">
				<button
					type="button"
					onClick={() => setMode(mode === "interval" ? null : "interval")}
					disabled={mode === "muse"}
					className="pencil-link inline-flex items-center gap-1.5 text-ink/70 hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed"
				>
					<CalendarClock className="w-3.5 h-3.5" />
					Switch to {nextInterval === "year" ? "yearly (save 20%)" : "monthly"}
				</button>
				<span className="text-ink/25">·</span>
				<button
					type="button"
					onClick={() => setMode(mode === "muse" ? null : "muse")}
					disabled={mode === "interval"}
					className="pencil-link inline-flex items-center gap-1.5 text-ink/70 hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed"
				>
					<Sparkle className="w-3.5 h-3.5 text-primary" />
					{props.museEnabled ? "Remove Muse" : "Add Muse"}
				</button>
			</div>

			{mode && preview ? (
				<InlineReview
					preview={preview}
					proposedChannels={props.channels}
					proposedMuse={mode === "muse" ? !props.museEnabled : props.museEnabled}
					proposedInterval={mode === "interval" ? nextInterval : undefined}
					onCancel={() => setMode(null)}
				/>
			) : null}
		</div>
	);
}
