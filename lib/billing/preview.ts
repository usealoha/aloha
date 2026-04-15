// Compute what a pending subscription change would cost before applying.
// Polar doesn't have a preview endpoint, so we derive proration ourselves
// using the standard "create_prorations" formula (their default).
//
//   unusedCredit = oldPerPeriod * daysRemaining / totalDays
//   newCharge    = newPerPeriod * daysRemaining / totalDays
//   immediate    = newCharge - unusedCredit  (can be negative = credit)
//
// Matches Polar's behavior closely enough to set user expectations. The
// exact invoiced amount may differ by cents depending on rounding.

import { calcMonthly, effectivePrice, type Interval } from "./pricing";

export type PlanKey = "basic" | "basic_muse";

export type PreviewInput = {
	current: {
		plan: PlanKey;
		channels: number;
		interval: Interval;
		currentPeriodEnd: Date | null;
	};
	next: {
		plan: PlanKey;
		channels: number;
		interval: Interval;
	};
};

export type PreviewOutput = {
	// Human-readable description of what's changing.
	summary: string[];
	// Prior recurring price per month (display-normalized).
	oldPerMonth: number;
	newPerMonth: number;
	// Per-period charge (monthly or yearly depending on interval).
	oldPerPeriod: number;
	newPerPeriod: number;
	// Prorated amount billed immediately. Positive = charge; negative = credit.
	immediateCharge: number;
	daysRemaining: number;
	totalDaysInPeriod: number;
	// Amount of the next regular invoice.
	nextBillingAmount: number;
	nextBillingDate: Date | null;
};

const DAYS_IN_MONTH = 30;
const DAYS_IN_YEAR = 365;

function perMonth(plan: PlanKey, channels: number, interval: Interval) {
	return effectivePrice(channels, {
		muse: plan === "basic_muse",
		interval,
	}).effectivePerMonth;
}

function perPeriod(plan: PlanKey, channels: number, interval: Interval) {
	const m = calcMonthly(channels);
	const monthly = plan === "basic_muse" ? m.withMuse : m.basic;
	// Yearly = monthly * 12 with 20% annual discount already folded in.
	return interval === "year" ? monthly * 12 * 0.8 : monthly;
}

export function previewChange(input: PreviewInput): PreviewOutput {
	const { current, next } = input;
	const totalDays = next.interval === "year" ? DAYS_IN_YEAR : DAYS_IN_MONTH;

	const now = new Date();
	const periodEnd = current.currentPeriodEnd;
	const msRemaining = periodEnd ? Math.max(0, periodEnd.getTime() - now.getTime()) : 0;
	const daysRemaining = msRemaining / (1000 * 60 * 60 * 24);

	const oldPerPeriod = perPeriod(current.plan, current.channels, current.interval);
	const newPerPeriod = perPeriod(next.plan, next.channels, next.interval);

	const oldDaily = oldPerPeriod / totalDays;
	const newDaily = newPerPeriod / totalDays;
	const immediateCharge = (newDaily - oldDaily) * daysRemaining;

	const summary: string[] = [];
	if (current.channels !== next.channels) {
		summary.push(
			`Channels: ${current.channels} → ${next.channels} (${
				next.channels > current.channels ? "+" : ""
			}${next.channels - current.channels})`,
		);
	}
	if (current.plan !== next.plan) {
		summary.push(
			next.plan === "basic_muse"
				? "Add Muse — style-trained voice and advanced campaigns"
				: "Remove Muse — drop to Basic only",
		);
	}
	if (current.interval !== next.interval) {
		summary.push(
			`Billing: ${current.interval}ly → ${next.interval}ly`,
		);
	}

	return {
		summary,
		oldPerMonth: perMonth(current.plan, current.channels, current.interval),
		newPerMonth: perMonth(next.plan, next.channels, next.interval),
		oldPerPeriod,
		newPerPeriod,
		immediateCharge,
		daysRemaining: Math.round(daysRemaining),
		totalDaysInPeriod: totalDays,
		nextBillingAmount: newPerPeriod,
		nextBillingDate: periodEnd,
	};
}
