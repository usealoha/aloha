// Polar product IDs are environment-specific (one set in sandbox, another
// in production). The setup script writes them to env vars; this module
// reads them back with a clear error if a lookup is attempted before
// setup has been run.

import { env } from "@/lib/env";

// "basic" = Basic-only product. "bundle" = Basic+Muse combined pricing.
// Switching Muse on/off is a product migration on the same subscription.
export type ProductKey = "basic" | "bundle";
export type Interval = "month" | "year";

export type ProductSlot = `${ProductKey}_${Interval}`;

export const PRODUCT_SLOTS: ProductSlot[] = [
	"basic_month",
	"basic_year",
	"bundle_month",
	"bundle_year",
];

export function productSlot(key: ProductKey, interval: Interval): ProductSlot {
	return `${key}_${interval}`;
}

const ENV_BY_SLOT: Record<ProductSlot, () => string | undefined> = {
	basic_month: () => env.POLAR_PRODUCT_BASIC_MONTH,
	basic_year: () => env.POLAR_PRODUCT_BASIC_YEAR,
	bundle_month: () => env.POLAR_PRODUCT_BUNDLE_MONTH,
	bundle_year: () => env.POLAR_PRODUCT_BUNDLE_YEAR,
};

export function productId(slot: ProductSlot): string {
	const id = ENV_BY_SLOT[slot]();
	if (!id) {
		throw new Error(
			`Polar product not configured for slot "${slot}". Run scripts/polar-setup.ts and copy the printed env vars into .env.local.`,
		);
	}
	return id;
}

export function productIdsConfigured(): boolean {
	return PRODUCT_SLOTS.every((s) => ENV_BY_SLOT[s]());
}
