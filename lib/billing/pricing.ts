// Single source of truth for the channel-band pricing model. The marketing
// pricing-calculator imports BANDS from here so the displayed price always
// matches what we register with Polar and what we charge.

export type Band = {
	from: number;
	to: number; // Infinity for the last band
	basic: number; // USD per channel within this band, Basic plan
	muse: number; // USD per channel within this band, Muse add-on
};

export const BANDS: Band[] = [
	{ from: 1, to: 10, basic: 5, muse: 5 },
	{ from: 11, to: 15, basic: 4.5, muse: 4.5 },
	{ from: 16, to: 20, basic: 4, muse: 4 },
	{ from: 21, to: 25, basic: 3.5, muse: 3.5 },
	{ from: 26, to: Infinity, basic: 3, muse: 3 },
];

export const ANNUAL_DISCOUNT = 0.2;
export const FREE_TIER_CHANNELS = 3;

export function bandFor(position: number): Band {
	return BANDS.find((b) => position >= b.from && position <= b.to) ?? BANDS[BANDS.length - 1];
}

export function calcMonthly(channels: number) {
	let basic = 0;
	let muse = 0;
	for (let i = 1; i <= channels; i++) {
		const b = bandFor(i);
		basic += b.basic;
		muse += b.muse;
	}
	return { basic, muse, withMuse: basic + muse };
}

export type Interval = "month" | "year";

export function effectivePrice(
	channels: number,
	options: { muse: boolean; interval: Interval },
) {
	const { basic, muse, withMuse } = calcMonthly(channels);
	const monthly = options.muse ? withMuse : basic;
	const perMonth = options.interval === "year" ? monthly * (1 - ANNUAL_DISCOUNT) : monthly;
	return {
		basicMonthly: basic,
		museMonthly: muse,
		effectivePerMonth: perMonth,
		annualTotal: perMonth * 12,
	};
}
