// BillingService: one Polar subscription per user, on either the "basic"
// or "bundle" (Basic+Muse) product. Toggling Muse is a product migration
// via polar.subscriptions.update — no second checkout.

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions, users } from "@/db/schema";
import { polar } from "./polar";
import { productId, productSlot, type Interval, type ProductKey } from "./products";
import { env } from "@/lib/env";

export type LogicalSubscription = {
	plan: "free" | "basic" | "basic_muse";
	museEnabled: boolean;
	channels: number;
	interval: Interval | null;
	currentPeriodEnd: Date | null;
	cancelAtPeriodEnd: boolean;
	polarSubscriptionId: string | null;
};

export async function getLogicalSubscription(userId: string): Promise<LogicalSubscription> {
	const rows = await db
		.select()
		.from(subscriptions)
		.where(eq(subscriptions.userId, userId));

	const active = rows.find(
		(r) => r.status === "active" || r.status === "past_due",
	);

	if (!active) {
		return {
			plan: "free",
			museEnabled: false,
			channels: 0,
			interval: null,
			currentPeriodEnd: null,
			cancelAtPeriodEnd: false,
			polarSubscriptionId: null,
		};
	}

	return {
		plan: active.productKey === "bundle" ? "basic_muse" : "basic",
		museEnabled: active.productKey === "bundle",
		channels: active.seats,
		interval: active.interval,
		currentPeriodEnd: active.currentPeriodEnd,
		cancelAtPeriodEnd: active.cancelAtPeriodEnd,
		polarSubscriptionId: active.polarSubscriptionId,
	};
}

export async function createCheckout(args: {
	userId: string;
	plan: ProductKey;
	interval: Interval;
	channels: number;
}) {
	const [user] = await db
		.select({
			id: users.id,
			email: users.email,
			name: users.name,
			polarCustomerId: users.polarCustomerId,
		})
		.from(users)
		.where(eq(users.id, args.userId))
		.limit(1);
	if (!user) throw new Error("User not found");

	const seats = Math.max(1, args.channels);
	const slot = productSlot(args.plan, args.interval);
	const checkout = await polar.checkouts.create({
		products: [productId(slot)],
		seats,
		externalCustomerId: user.id,
		customerEmail: user.email,
		customerName: user.name ?? undefined,
		successUrl: `${env.APP_URL}/app/settings/billing?success=1`,
		metadata: {
			internal_user_id: user.id,
			plan: args.plan,
			interval: args.interval,
		},
	});

	return { url: checkout.url };
}

export async function syncChannelQuantity(userId: string, channels: number) {
	const sub = await getLogicalSubscription(userId);
	if (!sub.polarSubscriptionId) return;

	const seats = Math.max(1, channels);
	await polar.subscriptions.update({
		id: sub.polarSubscriptionId,
		subscriptionUpdate: { seats },
	});

	await db
		.update(subscriptions)
		.set({ seats, updatedAt: new Date() })
		.where(eq(subscriptions.polarSubscriptionId, sub.polarSubscriptionId));
}

// Migrate the active subscription to the bundle product (adds Muse) or
// back to the basic product (removes Muse). Polar handles proration.
export async function setMuseEnabled(userId: string, enabled: boolean) {
	const sub = await getLogicalSubscription(userId);
	if (!sub.polarSubscriptionId || !sub.interval) {
		throw new Error("No active subscription to modify");
	}
	if (sub.museEnabled === enabled) return;

	const targetKey: ProductKey = enabled ? "bundle" : "basic";
	const targetSlot = productSlot(targetKey, sub.interval);

	await polar.subscriptions.update({
		id: sub.polarSubscriptionId,
		subscriptionUpdate: { productId: productId(targetSlot) },
	});
	// Webhook subscription.updated will reconcile the DB row.
}

export async function cancelSubscription(userId: string) {
	const sub = await getLogicalSubscription(userId);
	if (!sub.polarSubscriptionId) return;
	await polar.subscriptions.revoke({ id: sub.polarSubscriptionId });
}

// Idempotent upsert from a Polar subscription payload. Called by the
// webhook handler on subscription.created/updated/canceled/revoked/past_due.
export async function upsertSubscriptionFromPolar(payload: {
	id: string;
	productId: string;
	status: string;
	seats?: number | null;
	currentPeriodEnd?: Date | null;
	cancelAtPeriodEnd?: boolean | null;
	externalCustomerId?: string | null;
	metadata?: Record<string, unknown> | null;
}) {
	const internalUserId =
		(payload.metadata?.internal_user_id as string | undefined) ??
		payload.externalCustomerId ??
		undefined;
	if (!internalUserId) {
		throw new Error(
			`Polar subscription ${payload.id} has no internal_user_id metadata or externalCustomerId`,
		);
	}

	const productKey = productKeyFromPolarProductId(payload.productId);
	const interval = intervalFromPolarProductId(payload.productId);
	if (!productKey || !interval) {
		throw new Error(
			`Unknown Polar product ${payload.productId} on subscription ${payload.id}`,
		);
	}

	const status = mapPolarStatus(payload.status);

	const existing = await db
		.select()
		.from(subscriptions)
		.where(eq(subscriptions.polarSubscriptionId, payload.id))
		.limit(1);

	const values = {
		userId: internalUserId,
		polarSubscriptionId: payload.id,
		productKey,
		status,
		interval,
		seats: payload.seats ?? 1,
		currentPeriodEnd: payload.currentPeriodEnd ?? null,
		cancelAtPeriodEnd: payload.cancelAtPeriodEnd ?? false,
		updatedAt: new Date(),
	};

	if (existing.length > 0) {
		await db
			.update(subscriptions)
			.set(values)
			.where(eq(subscriptions.polarSubscriptionId, payload.id));
	} else {
		await db.insert(subscriptions).values(values);
	}
}

function productKeyFromPolarProductId(id: string): ProductKey | null {
	if (id === env.POLAR_PRODUCT_BASIC_MONTH || id === env.POLAR_PRODUCT_BASIC_YEAR) {
		return "basic";
	}
	if (id === env.POLAR_PRODUCT_BUNDLE_MONTH || id === env.POLAR_PRODUCT_BUNDLE_YEAR) {
		return "bundle";
	}
	return null;
}

function intervalFromPolarProductId(id: string): Interval | null {
	if (id === env.POLAR_PRODUCT_BASIC_MONTH || id === env.POLAR_PRODUCT_BUNDLE_MONTH) {
		return "month";
	}
	if (id === env.POLAR_PRODUCT_BASIC_YEAR || id === env.POLAR_PRODUCT_BUNDLE_YEAR) {
		return "year";
	}
	return null;
}

function mapPolarStatus(
	status: string,
): "incomplete" | "active" | "past_due" | "canceled" | "revoked" {
	switch (status) {
		case "active":
		case "trialing":
			return "active";
		case "past_due":
			return "past_due";
		case "canceled":
			return "canceled";
		case "revoked":
		case "unpaid":
			return "revoked";
		default:
			return "incomplete";
	}
}
