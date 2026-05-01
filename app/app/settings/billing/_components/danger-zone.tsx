"use client";

import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cancelMyPlan, resumeMyPlan } from "../actions";

function formatDate(d: Date) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(d);
}

type Props = {
	cancelAtPeriodEnd: boolean;
	currentPeriodEndISO: string | null;
	freeTierChannels: number;
	currentChannels: number;
};

const CONFIRM_PHRASE = "cancel my plan";

export function DangerZone(props: Props) {
	const [armed, setArmed] = useState(false);
	const [typed, setTyped] = useState("");
	const [pending, startTransition] = useTransition();

	const endDate = props.currentPeriodEndISO
		? new Date(props.currentPeriodEndISO)
		: null;

	if (props.cancelAtPeriodEnd) {
		return (
			<div className="pt-8 mt-8 border-t border-border">
				<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-3">
					Danger zone
				</p>
				<section className="rounded-2xl border border-red-200/60 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/20 p-6">
					<div className="flex items-start gap-3">
						<span className="grid place-items-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 shrink-0">
							<AlertTriangle className="w-4 h-4 text-red-700 dark:text-red-400" />
						</span>
						<div className="min-w-0 flex-1">
							<h3 className="text-[14px] font-semibold text-ink">
								Your plan is set to cancel
							</h3>
							<p className="mt-1 text-[12.5px] text-ink/65 leading-[1.55]">
								Paid features stay on until{" "}
								{endDate ? (
									<span className="text-ink font-medium">
										{formatDate(endDate)}
									</span>
								) : (
									"the end of the current period"
								)}
								. After that you drop to the free tier. Resume any time before
								the end date.
							</p>
							<form action={resumeMyPlan} className="mt-4">
								<button
									type="submit"
									className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-red-300 dark:border-red-800 text-[12.5px] font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
								>
									<RotateCcw className="w-3.5 h-3.5" />
									Resume plan
								</button>
							</form>
						</div>
					</div>
				</section>
			</div>
		);
	}

	const matches = typed.trim().toLowerCase() === CONFIRM_PHRASE;
	const extraChannels = Math.max(
		0,
		props.currentChannels - props.freeTierChannels,
	);

	const handleSubmit = () => {
		if (!matches) return;
		startTransition(async () => {
			try {
				await cancelMyPlan();
				toast.success("Plan set to cancel at period end.");
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				if (msg.includes("NEXT_REDIRECT")) return;
				toast.error(msg);
			}
		});
	};

	return (
		<div className="pt-8 mt-8 border-t border-border">
			<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-3">
				Danger zone
			</p>
			<section className="rounded-2xl border border-red-200/60 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/20 p-6">
				<div className="flex items-start gap-3">
					<span className="grid place-items-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 shrink-0">
						<AlertTriangle className="w-4 h-4 text-red-700 dark:text-red-400" />
					</span>
					<div className="min-w-0 flex-1">
						<h3 className="text-[14px] font-semibold text-ink">
							Cancel subscription
						</h3>
						<p className="mt-1 text-[12.5px] text-ink/65 leading-[1.55]">
							You&apos;ll keep paid features until{" "}
							{endDate ? (
								<span className="text-ink font-medium">
									{formatDate(endDate)}
								</span>
							) : (
								"the end of the current period"
							)}
							, then drop back to the free tier ({props.freeTierChannels}{" "}
							channels). {extraChannels > 0 ? (
								<>
									{extraChannels} extra channel{extraChannels === 1 ? "" : "s"}{" "}
									will be paused — not deleted.
								</>
							) : null}
						</p>

						{armed ? (
							<div className="mt-4 space-y-3">
								<label className="block">
									<span className="block text-[12px] text-ink/65 mb-1.5">
										Type{" "}
										<strong className="text-ink">{CONFIRM_PHRASE}</strong> to
										confirm:
									</span>
									<input
										type="text"
										value={typed}
										onChange={(e) => setTyped(e.target.value)}
										autoFocus
										autoComplete="off"
										className="w-full h-10 px-3 rounded-lg border border-border-strong bg-background text-[13.5px] text-ink focus:outline-none focus:border-ink transition-colors"
									/>
								</label>
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => {
											setArmed(false);
											setTyped("");
										}}
										disabled={pending}
										className="inline-flex items-center h-9 px-4 rounded-full border border-border text-[12.5px] text-ink/75 hover:text-ink hover:border-ink transition-colors disabled:opacity-40"
									>
										Keep my plan
									</button>
									<button
										type="button"
										onClick={handleSubmit}
										disabled={!matches || pending}
										className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-red-600 text-white text-[12.5px] font-medium hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
									>
										{pending ? (
											<Loader2 className="w-3.5 h-3.5 animate-spin" />
										) : null}
										Confirm cancellation
									</button>
								</div>
							</div>
						) : (
							<button
								type="button"
								onClick={() => setArmed(true)}
								className="mt-4 inline-flex items-center h-9 px-4 rounded-full border border-red-300 dark:border-red-800 text-[12.5px] font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
							>
								Cancel subscription…
							</button>
						)}
					</div>
				</div>
			</section>
		</div>
	);
}
