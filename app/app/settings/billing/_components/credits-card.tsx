"use client";

import { Plus, Sparkles, Zap } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import {
	purchaseCreditTopUpAction,
	startCreditBoostAction,
	stopCreditBoostAction,
} from "@/app/actions/billing-addons";
import {
	CREDIT_BOOST_AMOUNT,
	CREDIT_BOOST_MONTHLY_USD,
	CREDIT_TOPUP_AMOUNT,
	CREDIT_TOPUP_USD,
} from "@/lib/billing/pricing";

type Boost =
	| { active: false }
	| { active: true; cancelAtPeriodEnd: boolean; nextRenewal: Date | null };

type Props = {
	balance: number;
	monthlyGrant: number;
	periodEndsAt: Date | null;
	isPaid: boolean;
	trialActive: boolean;
	boost: Boost;
};

function formatDate(d: Date) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
	}).format(d);
}

// Account-level credits summary. Shows the running balance, the monthly
// grant, when the next reset lands, and inline controls for top-up +
// recurring boost subscription. Lives on the billing page.
export function CreditsCard({
	balance,
	monthlyGrant,
	periodEndsAt,
	isPaid,
	trialActive,
	boost,
}: Props) {
	const used = Math.max(0, monthlyGrant - balance);
	const pct = monthlyGrant > 0 ? Math.min(100, (used / monthlyGrant) * 100) : 0;
	const noGrant = monthlyGrant === 0;

	const [topupPending, startTopup] = useTransition();
	const [boostPending, startBoost] = useTransition();

	const handleTopUp = () => {
		const id = toast.loading("Opening checkout…");
		startTopup(async () => {
			try {
				const { url } = await purchaseCreditTopUpAction();
				toast.dismiss(id);
				window.location.href = url;
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Couldn't start top-up.", {
					id,
				});
			}
		});
	};

	const handleStartBoost = () => {
		const id = toast.loading("Opening checkout…");
		startBoost(async () => {
			try {
				const result = await startCreditBoostAction();
				if (result.kind === "checkout") {
					toast.dismiss(id);
					window.location.href = result.url;
				} else {
					toast.success("Credit boost resumed.", { id });
				}
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Couldn't start boost.", {
					id,
				});
			}
		});
	};

	const handleStopBoost = () => {
		const id = toast.loading("Canceling boost…");
		startBoost(async () => {
			try {
				const result = await stopCreditBoostAction();
				if (result.canceledAtPeriodEnd) {
					toast.success("Boost set to cancel at period end.", { id });
				} else {
					toast.error(result.reason, { id });
				}
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Couldn't cancel boost.", {
					id,
				});
			}
		});
	};

	return (
		<section className="rounded-3xl border border-border bg-background-elev overflow-hidden">
			<div className="px-6 lg:px-8 pt-6 lg:pt-7 pb-5">
				<div className="flex items-baseline justify-between gap-4 mb-4">
					<div>
						<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 inline-flex items-center gap-2">
							<Sparkles className="w-3 h-3 text-primary" />
							Credits
						</p>
						<p className="mt-1 text-[12.5px] text-ink/55">
							One pool across every workspace you own. Resets monthly.
						</p>
					</div>
					{periodEndsAt ? (
						<p className="text-[11.5px] text-ink/50 font-mono">
							resets {formatDate(periodEndsAt)}
						</p>
					) : null}
				</div>

				<div className="flex items-baseline gap-3 mb-3">
					<span className="font-display text-[40px] leading-none tracking-[-0.02em] text-ink tabular-nums">
						{balance}
					</span>
					<span className="text-[13px] text-ink/55">
						of {monthlyGrant} this period
					</span>
				</div>

				{!noGrant ? (
					<div className="h-1.5 w-full rounded-full bg-background overflow-hidden">
						<div
							className="h-full bg-primary transition-all"
							style={{ width: `${pct}%` }}
						/>
					</div>
				) : null}

				<p className="mt-4 text-[12px] text-ink/55 leading-[1.55]">
					{noGrant
						? "Trial ended — upgrade to restart your monthly credit grant."
						: isPaid
							? "Each AI action consumes credits — refine costs 1, draft costs 5, image costs 10. Top-ups stack on top of your monthly grant."
							: trialActive
								? `${monthlyGrant} credits during your trial. Upgrade for the full Basic monthly grant.`
								: ""}
				</p>

				{isPaid ? (
					<div className="mt-5 pt-5 border-t border-border flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={handleTopUp}
							disabled={topupPending}
							className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-ink text-background text-[12.5px] font-medium hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
						>
							<Plus className="w-3.5 h-3.5" />
							Top up {CREDIT_TOPUP_AMOUNT} credits · ${CREDIT_TOPUP_USD}
						</button>

						{boost.active ? (
							<div className="flex items-center gap-2 text-[12px] text-ink/65">
								<span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-peach-100/70 text-ink">
									<Zap className="w-3.5 h-3.5 text-primary" />
									Boost active · +{CREDIT_BOOST_AMOUNT}/mo
								</span>
								{boost.cancelAtPeriodEnd ? (
									<span className="text-[11.5px] text-ink/55">
										ends {boost.nextRenewal ? formatDate(boost.nextRenewal) : "soon"}
									</span>
								) : (
									<button
										type="button"
										onClick={handleStopBoost}
										disabled={boostPending}
										className="pencil-link text-[12px] text-ink/65 hover:text-ink disabled:opacity-40"
									>
										Cancel boost
									</button>
								)}
							</div>
						) : (
							<button
								type="button"
								onClick={handleStartBoost}
								disabled={boostPending}
								className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-border text-[12.5px] text-ink/75 hover:text-ink hover:border-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
							>
								<Zap className="w-3.5 h-3.5" />
								Add boost · +{CREDIT_BOOST_AMOUNT}/mo · ${CREDIT_BOOST_MONTHLY_USD}/mo
							</button>
						)}
					</div>
				) : null}
			</div>
		</section>
	);
}
