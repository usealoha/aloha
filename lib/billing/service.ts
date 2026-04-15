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
	// Raw status for UI treatments that care about past_due vs active.
	status: "active" | "past_due" | null;
	pastDue: boolean;
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
			status: null,
			pastDue: false,
		};
	}

	const status = active.status === "past_due" ? "past_due" : "active";
	return {
		plan: active.productKey === "bundle" ? "basic_muse" : "basic",
		museEnabled: active.productKey === "bundle",
		channels: active.seats,
		interval: active.interval,
		currentPeriodEnd: active.currentPeriodEnd,
		cancelAtPeriodEnd: active.cancelAtPeriodEnd,
		polarSubscriptionId: active.polarSubscriptionId,
		status,
		pastDue: status === "past_due",
	};
}

// Creates a signed Polar customer portal URL the user can visit briefly
// to update their payment method. This is the only hand-off to Polar's
// hosted UI — required because card entry must be PCI-compliant.
export async function createCustomerPortalUrl(userId: string): Promise<string | null> {
	const [user] = await db
		.select({ polarCustomerId: users.polarCustomerId })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
	if (!user?.polarCustomerId) return null;

	const session = await polar.customerSessions.create({
		customerId: user.polarCustomerId,
	});
	return session.customerPortalUrl;
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

// Flip the billing interval (monthly ↔ yearly). Same mechanism as Muse
// toggle — migrates to a different product ID while keeping seats.
export async function setBillingInterval(userId: string, nextInterval: Interval) {
	const sub = await getLogicalSubscription(userId);
	if (!sub.polarSubscriptionId || !sub.interval) {
		throw new Error("No active subscription to modify");
	}
	if (sub.interval === nextInterval) return;

	const currentKey: ProductKey = sub.museEnabled ? "bundle" : "basic";
	const targetSlot = productSlot(currentKey, nextInterval);

	await polar.subscriptions.update({
		id: sub.polarSubscriptionId,
		subscriptionUpdate: { productId: productId(targetSlot) },
	});
}

export async function cancelSubscription(userId: string) {
	const sub = await getLogicalSubscription(userId);
	if (!sub.polarSubscriptionId) return;
	await polar.subscriptions.revoke({ id: sub.polarSubscriptionId });
}

export type InvoiceRow = {
	id: string;
	createdAt: Date;
	invoiceNumber: string;
	totalAmount: number; // cents
	currency: string;
	status: string; // paid | refunded | partially_refunded | pending
};

// Fetches the user's billing history. Returns newest-first. Invoice PDF
// download goes through /api/billing/invoice/[id] since Polar only
// exposes the URL via a separate API call.
export async function listInvoices(userId: string, limit = 12): Promise<InvoiceRow[]> {
	const [user] = await db
		.select({ polarCustomerId: users.polarCustomerId })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
	if (!user?.polarCustomerId) return [];

	const page = await polar.orders.list({
		customerId: user.polarCustomerId,
		limit,
	});
	const rows: InvoiceRow[] = [];
	for await (const p of page) {
		for (const o of p.result.items ?? []) {
			rows.push({
				id: o.id,
				createdAt: o.createdAt,
				invoiceNumber: o.invoiceNumber,
				totalAmount: o.totalAmount,
				currency: o.currency,
				status: o.status,
			});
		}
		break; // first page only — `limit` already caps it
	}
	return rows;
}

export async function getInvoiceUrl(userId: string, orderId: string): Promise<string | null> {
	const [user] = await db
		.select({ polarCustomerId: users.polarCustomerId })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
	if (!user?.polarCustomerId) return null;

	const invoice = await polar.orders.invoice({ id: orderId });
	return invoice?.url ?? null;
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
