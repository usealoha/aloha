// Polar product IDs are environment-specific (one set in sandbox, another
// in production). The setup script writes them to env vars; this module
// reads them back with a clear error if a lookup is attempted before
// setup has been run.

import { env } from "@/lib/env";

// Base-plan families:
//   "basic"  = Basic-only product. Seats = channels.
//   "bundle" = Basic+Muse combined. Switching muse on/off is a product
//              migration on the same subscription.
//
// Add-on families (flat per-seat pricing, single graduated tier):
//   "workspace_addon" = extra workspaces. Seats = extra workspace count.
//   "member_addon"    = extra member slots on a single workspace. One sub
//                       per workspace; seats = extra members beyond the
//                       included allowance.
//
// Credit families:
//   "credits_topup"  = one-off purchase (no recurringInterval). Polar
//                      fires order.paid; webhook grants the bundle to
//                      the buyer's ledger.
//   "credits_boost"  = recurring monthly subscription that grants extra
//                      credits on every renewal, on top of the plan's
//                      normal monthly grant.
export type ProductKey =
	| "basic"
	| "bundle"
	| "workspace_addon"
	| "member_addon"
	| "credits_topup"
	| "credits_boost";

// Subset of ProductKey that lands as a row in `subscriptions`. The
// credits_topup product is fulfilled via a one-off order, so it never
// has a subscription representation. Drizzle's column enum mirrors this.
export type SubscriptionProductKey = Exclude<ProductKey, "credits_topup">;

export type Interval = "month" | "year";

// Recurring slots are <key>_<interval>. The top-up has no interval — it
// gets its own bare slot. Encoded as a literal string union so consumers
// can index into ENV_BY_SLOT without runtime hand-waving.
export type ProductSlot =
	| `${Exclude<ProductKey, "credits_topup">}_${Interval}`
	| "credits_topup";

export const PRODUCT_SLOTS: ProductSlot[] = [
	"basic_month",
	"basic_year",
	"bundle_month",
	"bundle_year",
	"workspace_addon_month",
	"workspace_addon_year",
	"member_addon_month",
	"member_addon_year",
	"credits_boost_month",
	"credits_boost_year",
	"credits_topup",
];

export function productSlot(key: ProductKey, interval: Interval): ProductSlot {
	if (key === "credits_topup") return "credits_topup";
	return `${key}_${interval}` as ProductSlot;
}

const ENV_BY_SLOT: Record<ProductSlot, () => string | undefined> = {
	basic_month: () => env.POLAR_PRODUCT_BASIC_MONTH,
	basic_year: () => env.POLAR_PRODUCT_BASIC_YEAR,
	bundle_month: () => env.POLAR_PRODUCT_BUNDLE_MONTH,
	bundle_year: () => env.POLAR_PRODUCT_BUNDLE_YEAR,
	workspace_addon_month: () => env.POLAR_PRODUCT_WORKSPACE_ADDON_MONTH,
	workspace_addon_year: () => env.POLAR_PRODUCT_WORKSPACE_ADDON_YEAR,
	member_addon_month: () => env.POLAR_PRODUCT_MEMBER_ADDON_MONTH,
	member_addon_year: () => env.POLAR_PRODUCT_MEMBER_ADDON_YEAR,
	credits_boost_month: () => env.POLAR_PRODUCT_CREDITS_BOOST_MONTH,
	credits_boost_year: () => env.POLAR_PRODUCT_CREDITS_BOOST_YEAR,
	credits_topup: () => env.POLAR_PRODUCT_CREDITS_TOPUP,
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
