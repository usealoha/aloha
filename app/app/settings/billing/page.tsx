import { PricingCalculator } from "@/app/(marketing)/pricing/_components/pricing-calculator";
import { WishlistForm } from "@/app/(marketing)/pricing/_components/wishlist-form";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, wishlist } from "@/db/schema";
import {
	effectivePrice,
	FREE_TIER_CHANNELS,
	MEMBER_ADDON_MONTHLY_USD,
	WORKSPACE_ADDON_MONTHLY_USD,
} from "@/lib/billing/pricing";
import { getLogicalSubscription, listInvoices } from "@/lib/billing/service";
import {
	getAccountEntitlements,
	getAccountSeats,
} from "@/lib/billing/account-entitlements";
import { getCreditsSnapshot } from "@/lib/billing/credits";
import { getConnectedChannels } from "@/lib/channels/connected";
import { routes } from "@/lib/routes";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { FlashToast } from "@/components/ui/flash-toast";
import { getCurrentContext } from "@/lib/current-context";
import { hasRole, ROLES } from "@/lib/workspaces/roles";
import { AddonsSection } from "./_components/addons-section";
import { ChannelAdjuster } from "./_components/channel-adjuster";
import { CreditsCard } from "./_components/credits-card";
import { DangerZone } from "./_components/danger-zone";
import { InvoicesList } from "./_components/invoices";
import { PastDueBanner } from "./_components/past-due-banner";
import { PlanSummary } from "./_components/plan-summary";

const IS_DEV = process.env.NODE_ENV === "development";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
	const session = await auth();
	if (!session?.user?.id) redirect(routes.signin);

	const userId = session.user.id;
	const ctx = (await getCurrentContext())!;
	const workspaceId = ctx.workspace.id;
	if (!hasRole(ctx.role, ROLES.OWNER)) {
		redirect("/app/dashboard");
	}
	const sub = await getLogicalSubscription(userId);
	const flashToast = (
		<FlashToast
			entries={[
				{
					param: "success",
					value: "1",
					type: "success",
					message: "Your subscription is up to date.",
				},
				{
					param: "canceled",
					value: "1",
					type: "info",
					message: "Your plan is set to cancel at the end of this period.",
				},
			]}
		/>
	);

	const connectedChannels = (await getConnectedChannels(workspaceId))
		.perAccountCount;

	if (!IS_DEV) {
		const [userRow] = await db
			.select({ name: users.name, email: users.email })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);
		const email = userRow?.email ?? "";
		const name = userRow?.name?.trim() || email.split("@")[0] || "";
		const existing = email
			? await db
					.select({ id: wishlist.id })
					.from(wishlist)
					.where(eq(wishlist.email, email))
					.limit(1)
			: [];
		const alreadyJoined = existing.length > 0;

		return (
			<div className="max-w-4xl space-y-8">
				<FreePlanHero connectedChannels={connectedChannels} />
				<BillingComingSoon
					prefill={email ? { name, email } : undefined}
					alreadyJoined={alreadyJoined}
				/>
			</div>
		);
	}

	if (sub.plan === "free") {
		return (
			<div className="max-w-4xl space-y-8">
				{flashToast}
				<FreePlanHero connectedChannels={connectedChannels} />
				<UpgradeBlock initialChannels={Math.max(5, connectedChannels)} />
			</div>
		);
	}

	const price = effectivePrice(sub.channels, {
		muse: sub.museEnabled,
		interval: sub.interval ?? "month",
	});
	const interval = sub.interval ?? "month";
	const currentPeriodEndISO = sub.currentPeriodEnd
		? sub.currentPeriodEnd.toISOString()
		: null;

	const invoices = await listInvoices(userId);

	// Aggregated entitlements across all owned workspaces. Powers the
	// workspace + seat add-on counters and the credits card.
	const [accountEnt, accountSeats, credits] = await Promise.all([
		getAccountEntitlements(userId),
		getAccountSeats(userId),
		getCreditsSnapshot(userId),
	]);

	return (
		<div className="max-w-4xl space-y-8">
			{sub.pastDue ? <PastDueBanner /> : null}
			{flashToast}

			<PlanSummary
				plan={sub.plan}
				channels={sub.channels}
				interval={interval}
				museEnabled={sub.museEnabled}
				perMonth={price.effectivePerMonth}
				annualTotal={price.annualTotal}
				nextBilling={sub.currentPeriodEnd}
				cancelAtPeriodEnd={sub.cancelAtPeriodEnd}
				currentPeriodEndISO={currentPeriodEndISO}
			/>

			<CreditsCard
				balance={credits.balance}
				monthlyGrant={credits.monthlyGrant}
				periodEndsAt={credits.periodEndsAt}
				isPaid={credits.isPaid}
				trialActive={credits.trialActive}
				boost={credits.boost}
			/>

			<ChannelAdjuster
				current={sub.channels}
				connected={connectedChannels}
				interval={interval}
				museEnabled={sub.museEnabled}
				currentPeriodEndISO={currentPeriodEndISO}
			/>

			<AddonsSection
				interval={interval}
				workspace={{
					included: accountEnt.workspaces.included,
					addonSeats: accountEnt.workspaces.addonSeats,
					used: accountEnt.workspaces.used,
					monthlyPerSeat: WORKSPACE_ADDON_MONTHLY_USD,
				}}
				seat={{
					included: accountSeats.included,
					addonSeats: accountSeats.addonSeats,
					used: accountSeats.used,
					pendingInvites: accountSeats.pendingInvites,
					monthlyPerSeat: MEMBER_ADDON_MONTHLY_USD,
				}}
			/>

			<InvoicesList invoices={invoices} />

			<DangerZone
				cancelAtPeriodEnd={sub.cancelAtPeriodEnd}
				currentPeriodEndISO={currentPeriodEndISO}
				freeTierChannels={FREE_TIER_CHANNELS}
				currentChannels={sub.channels}
			/>
		</div>
	);
}

function FreePlanHero({ connectedChannels }: { connectedChannels: number }) {
	return (
		<div className="rounded-3xl bg-background-elev border border-border overflow-hidden">
			<div className="px-8 lg:px-12 py-8 bg-peach-100 border-b border-border">
				<p className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-ink/60 mb-3">
					Current plan · trial
				</p>
				<div className="flex flex-wrap items-end justify-between gap-4">
					<p className="font-display text-[44px] lg:text-[56px] leading-[0.95] tracking-[-0.025em]">
						Basic trial
					</p>
					<p className="text-[13px] text-ink/65 font-mono">
						{connectedChannels} of {FREE_TIER_CHANNELS} channels in use
					</p>
				</div>
			</div>
			<div className="px-8 lg:px-12 py-7 grid sm:grid-cols-3 gap-6 text-[13px] text-ink/75">
				<Bullet>30 days of Basic — full publishing & AI</Bullet>
				<Bullet>Up to {FREE_TIER_CHANNELS} connected channels</Bullet>
				<Bullet>Drops to view-only after trial unless upgraded</Bullet>
			</div>
		</div>
	);
}

function Bullet({ children }: { children: React.ReactNode }) {
	return (
		<p className="flex items-start gap-2.5">
			<span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
			<span className="leading-[1.55]">{children}</span>
		</p>
	);
}

function UpgradeBlock({ initialChannels }: { initialChannels: number }) {
	return (
		<section className="space-y-5">
			<div>
				<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
					Upgrade
				</p>
				<h2 className="mt-1.5 font-display text-[28px] leading-[1.1] tracking-[-0.015em] text-ink">
					Pick a plan that fits how you publish.
				</h2>
				<p className="mt-2 text-[13.5px] text-ink/65 leading-[1.55] max-w-2xl">
					Channel-based pricing — pay only for what you connect. Add Muse for
					style-trained voice. Annual saves 20%.
				</p>
			</div>
			<PricingCalculator
				initialChannels={initialChannels}
				submitLabel="Continue to checkout"
			/>
		</section>
	);
}

function BillingComingSoon({
	prefill,
	alreadyJoined,
}: {
	prefill?: { name: string; email: string };
	alreadyJoined: boolean;
}) {
	return (
		<div className="max-w-4xl space-y-8">
			<section className="rounded-3xl bg-background-elev border border-border p-8 lg:p-10">
				<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
					Paid plans
				</p>
				<h2 className="font-display text-[28px] leading-[1.1] tracking-[-0.015em] text-ink">
					Pricing is coming soon.
				</h2>
				<p className="mt-3 text-[14.5px] text-ink/65 leading-[1.55] max-w-2xl">
					You're on the free tier — 3 channels, scheduling, calendar, and 50 AI
					generations a month. Enjoy it while we finalize paid plans.
				</p>
			</section>

			<section className="rounded-3xl bg-peach-100 border border-border p-8 lg:p-10">
				<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-4">
					Coming soon
				</p>
				<h2 className="font-display text-[28px] leading-[1.1] tracking-[-0.015em] text-ink">
					Muse — AI that sounds like you.
				</h2>
				<p className="mt-3 text-[14.5px] text-ink/65 leading-[1.55] max-w-2xl">
					Style-trained writing, per-channel variants, fan-out, advanced
					campaigns. We're opening beta access to a small group. Sign up
					and we'll be in touch.
				</p>
				<div className="mt-8 pt-6 border-t border-ink/10">
					<p className="text-[12.5px] text-ink/65 mb-4">
						<span className="font-medium text-ink">
							{alreadyJoined
								? "You're on the Muse beta wishlist"
								: "Join the Muse beta wishlist"}
						</span>
						<span className="text-ink/45">
							{" "}· we'll pick select participants
						</span>
					</p>
					<WishlistForm prefill={prefill} alreadyJoined={alreadyJoined} />
				</div>
			</section>
		</div>
	);
}

