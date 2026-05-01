import { NextRequest, NextResponse } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { eq } from "drizzle-orm";
import { captureException } from "@/lib/logger";
import { db } from "@/db";
import { workspaces } from "@/db/schema";
import { env } from "@/lib/env";
import { grantBoostForPeriod, grantTopUp } from "@/lib/billing/credits";
import {
	CREDIT_BOOST_AMOUNT,
	CREDIT_TOPUP_AMOUNT,
} from "@/lib/billing/pricing";
import { upsertSubscriptionFromPolar } from "@/lib/billing/service";

export async function POST(req: NextRequest) {
	if (!env.POLAR_WEBHOOK_SECRET) {
		return new NextResponse("Webhook secret not configured", { status: 500 });
	}

	const body = await req.text();
	const headers: Record<string, string> = {};
	req.headers.forEach((value, key) => {
		headers[key] = value;
	});

	let event;
	try {
		event = validateEvent(body, headers, env.POLAR_WEBHOOK_SECRET);
	} catch (err) {
		if (err instanceof WebhookVerificationError) {
			return new NextResponse("Invalid signature", { status: 401 });
		}
		console.error("[polar.webhook] parse failed", err);
		return new NextResponse("Invalid payload", { status: 400 });
	}

	try {
		switch (event.type) {
			case "subscription.created":
			case "subscription.updated":
			case "subscription.canceled":
			case "subscription.revoked":
			case "subscription.past_due": {
				const s = event.data;
				console.log(`[polar.webhook] ${event.type}`, {
					id: s.id,
					productId: s.productId,
					status: s.status,
					seats: (s as { seats?: number | null }).seats,
					externalCustomerId: (s.customer as { externalId?: string | null } | null)?.externalId,
					metadata: s.metadata,
				});
				await upsertSubscriptionFromPolar({
					id: s.id,
					productId: s.productId,
					status: s.status,
					seats: (s as { seats?: number | null }).seats ?? null,
					currentPeriodEnd: s.currentPeriodEnd ?? null,
					cancelAtPeriodEnd: s.cancelAtPeriodEnd ?? null,
					externalCustomerId:
						(s.customer as { externalId?: string | null } | null)?.externalId ?? null,
					polarCustomerId:
						(s.customer as { id?: string | null } | null)?.id ?? null,
					metadata: (s.metadata ?? null) as Record<string, unknown> | null,
				});
				console.log(`[polar.webhook] ${event.type} written to DB`);

				// Credit-boost subscriptions: grant the period bundle
				// idempotently. Active+past_due both grant; canceled/revoked
				// rows skip. The period fingerprint = sub id + period end so
				// each renewal grants exactly once.
				if (
					(event.type === "subscription.created" ||
						event.type === "subscription.updated") &&
					(s.status === "active" || s.status === "past_due") &&
					(s.productId === env.POLAR_PRODUCT_CREDITS_BOOST_MONTH ||
						s.productId === env.POLAR_PRODUCT_CREDITS_BOOST_YEAR)
				) {
					const ownerUserId = await resolveOwnerFromSubscriptionPayload(s);
					if (ownerUserId) {
						const periodEnd = s.currentPeriodEnd
							? new Date(s.currentPeriodEnd).toISOString()
							: "no-period";
						const fingerprint = `boost:${s.id}:${periodEnd}`;
						const result = await grantBoostForPeriod(
							ownerUserId,
							CREDIT_BOOST_AMOUNT,
							fingerprint,
						);
						console.log(
							`[polar.webhook] boost grant ${result.granted ? "applied" : "skipped (already granted)"} for ${ownerUserId} period ${periodEnd}`,
						);
					}
				}
				break;
			}
			case "order.paid": {
				// Top-up orders are the only ones we mint credits for.
				const o = event.data;
				const productId = (o as { productId?: string | null } | undefined)?.productId;
				if (productId !== env.POLAR_PRODUCT_CREDITS_TOPUP) {
					// Other product orders (base plan / add-ons) are tracked via
					// subscription.* events — nothing to do here.
					break;
				}
				const ownerUserId = await resolveOwnerFromOrderPayload(o);
				if (!ownerUserId) {
					console.warn(
						`[polar.webhook] order.paid for top-up ${o.id} could not be resolved to an owner — skipping grant`,
					);
					break;
				}
				const result = await grantTopUp(
					ownerUserId,
					CREDIT_TOPUP_AMOUNT,
					`topup:${o.id}`,
				);
				console.log(
					`[polar.webhook] topup grant ${result.granted ? "applied" : "skipped (already granted)"} for ${ownerUserId} order ${o.id}`,
				);
				break;
			}
			case "checkout.updated":
				// Acknowledge — subscription.* covers the entitlement state we care about.
				break;
			default:
				// Ignore other event types we didn't subscribe to.
				break;
		}
	} catch (err) {
		await captureException(err, {
			tags: { source: "polar.webhook", eventType: event.type },
		});
		console.error(`[polar.webhook] handler failed for ${event.type}`, err);
		return new NextResponse("Handler error", { status: 500 });
	}

	return NextResponse.json({ ok: true });
}

// Identity resolution shared by the boost + top-up paths. Mirrors the
// preference order in upsertSubscriptionFromPolar:
//   1. internal_user_id metadata, if present.
//   2. internal_workspace_id metadata → workspace.ownerUserId.
//   3. externalCustomerId interpreted as workspace.id, then ownerUserId.
async function resolveOwnerFromMetadata(
	metadata: Record<string, unknown> | null | undefined,
	externalCustomerId: string | null | undefined,
): Promise<string | null> {
	const userId =
		typeof metadata?.internal_user_id === "string"
			? metadata.internal_user_id
			: null;
	if (userId) return userId;

	const workspaceIdFromMeta =
		typeof metadata?.internal_workspace_id === "string"
			? metadata.internal_workspace_id
			: null;
	const workspaceId = workspaceIdFromMeta ?? externalCustomerId ?? null;
	if (!workspaceId) return null;

	const [ws] = await db
		.select({ ownerUserId: workspaces.ownerUserId })
		.from(workspaces)
		.where(eq(workspaces.id, workspaceId))
		.limit(1);
	return ws?.ownerUserId ?? null;
}

async function resolveOwnerFromSubscriptionPayload(
	s: unknown,
): Promise<string | null> {
	const obj = s as {
		metadata?: Record<string, unknown> | null;
		customer?: { externalId?: string | null } | null;
	};
	return resolveOwnerFromMetadata(
		obj.metadata ?? null,
		obj.customer?.externalId ?? null,
	);
}

async function resolveOwnerFromOrderPayload(
	o: unknown,
): Promise<string | null> {
	const obj = o as {
		metadata?: Record<string, unknown> | null;
		customer?: { externalId?: string | null } | null;
	};
	return resolveOwnerFromMetadata(
		obj.metadata ?? null,
		obj.customer?.externalId ?? null,
	);
}
