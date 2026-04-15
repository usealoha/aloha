"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import type { PreviewOutput } from "@/lib/billing/preview";
import { applyChange } from "../actions";

function formatMoney(n: number) {
	const r = Math.round(n * 100) / 100;
	return Number.isInteger(r) ? `${r}` : r.toFixed(2);
}

function formatSigned(n: number) {
	const abs = Math.abs(n);
	const r = Math.round(abs * 100) / 100;
	const v = Number.isInteger(r) ? `${r}` : r.toFixed(2);
	return `${n < 0 ? "−" : ""}$${v}`;
}

function formatDate(d: Date) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(d);
}

type Props = {
	preview: PreviewOutput;
	proposedChannels: number;
	proposedMuse: boolean;
	onCancel: () => void;
};

export function InlineReview({
	preview,
	proposedChannels,
	proposedMuse,
	onCancel,
}: Props) {
	const isCredit = preview.immediateCharge < 0;

	return (
		<div className="border-t border-border bg-peach-100/40">
			<div className="p-6 lg:p-8 space-y-5">
				<div className="flex items-center gap-2">
					<p className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-primary-deep">
						Review
					</p>
					<span className="h-px flex-1 bg-border" />
				</div>

				{preview.summary.length > 0 ? (
					<ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-ink/80">
						{preview.summary.map((s) => (
							<li key={s} className="inline-flex items-center gap-2">
								<ArrowRight className="w-3.5 h-3.5 text-primary" />
								{s}
							</li>
						))}
					</ul>
				) : null}

				<div className="grid sm:grid-cols-3 gap-5">
					<ReviewStat
						label="New rate"
						value={`$${formatMoney(preview.newPerMonth)}`}
						trailing="/ mo"
						hint={`was $${formatMoney(preview.oldPerMonth)} / mo`}
					/>
					<ReviewStat
						label={isCredit ? "Credit today" : "Charged today"}
						value={formatSigned(preview.immediateCharge)}
						hint={`Prorated · ${preview.daysRemaining} of ${preview.totalDaysInPeriod} days remain`}
						emphasize
					/>
					<ReviewStat
						label="Next invoice"
						value={`$${formatMoney(preview.nextBillingAmount)}`}
						hint={
							preview.nextBillingDate
								? `on ${formatDate(preview.nextBillingDate)}`
								: undefined
						}
					/>
				</div>

				<form
					action={applyChange}
					className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border"
				>
					<input type="hidden" name="channels" value={proposedChannels} />
					<input type="hidden" name="muse" value={proposedMuse ? "1" : "0"} />
					<p className="text-[11.5px] text-ink/50 inline-flex items-center gap-2 max-w-md">
						<AlertTriangle className="w-3.5 h-3.5" />
						Polar bills your card on file immediately. Receipt arrives by email.
					</p>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={onCancel}
							className="inline-flex items-center h-10 px-4 rounded-full text-[13px] text-ink/65 hover:text-ink transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="inline-flex items-center h-10 px-5 rounded-full bg-ink text-background text-[13.5px] font-medium hover:bg-primary transition-colors"
						>
							Confirm {formatSigned(preview.immediateCharge)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

function ReviewStat({
	label,
	value,
	trailing,
	hint,
	emphasize,
}: {
	label: string;
	value: string;
	trailing?: string;
	hint?: string;
	emphasize?: boolean;
}) {
	return (
		<div>
			<p className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-ink/55 mb-1">
				{label}
			</p>
			<p
				className={
					emphasize
						? "font-display text-[28px] tracking-[-0.015em] text-ink"
						: "font-display text-[22px] tracking-[-0.01em] text-ink"
				}
			>
				{value}
				{trailing ? (
					<span className="text-[13px] text-ink/50 font-mono ml-1.5">
						{trailing}
					</span>
				) : null}
			</p>
			{hint ? <p className="mt-1 text-[11.5px] text-ink/55">{hint}</p> : null}
		</div>
	);
}
