"use client";

import { Minus, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
	buyMemberSeats,
	buyWorkspaceSeats,
	releaseMemberSeats,
	releaseWorkspaceSeats,
} from "@/app/actions/billing-addons";

type Props = {
	interval: "month" | "year";
	workspace: {
		included: number;
		addonSeats: number;
		used: number;
		monthlyPerSeat: number;
	};
	seat: {
		included: number;
		addonSeats: number;
		used: number;
		pendingInvites: number;
		monthlyPerSeat: number;
	};
};

export function AddonsSection(props: Props) {
	return (
		<section
			id="addons"
			className="rounded-3xl border border-border bg-background-elev overflow-hidden"
		>
			<div className="px-6 lg:px-8 pt-6 lg:pt-7 pb-2">
				<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
					Add-ons
				</p>
				<p className="mt-1 text-[12.5px] text-ink/55">
					Extra workspaces (per tenant) and seats (per human, account-pooled).
				</p>
			</div>
			<WorkspaceRow {...props.workspace} interval={props.interval} />
			<div className="border-t border-border" />
			<SeatRow {...props.seat} interval={props.interval} />
		</section>
	);
}

function WorkspaceRow({
	included,
	addonSeats,
	used,
	monthlyPerSeat,
	interval,
}: Props["workspace"] & { interval: "month" | "year" }) {
	const [pending, startTransition] = useTransition();
	const [seats, setSeats] = useState(addonSeats);
	const total = included + seats;
	const remaining = Math.max(0, total - used);

	const onAdd = () => {
		const id = toast.loading("Opening checkout…");
		startTransition(async () => {
			try {
				const result = await buyWorkspaceSeats(1);
				if (result.kind === "checkout") {
					toast.dismiss(id);
					window.location.href = result.url;
				} else {
					setSeats(result.seats);
					toast.success("Added 1 workspace seat.", { id });
				}
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Couldn't add seat.",
					{ id },
				);
			}
		});
	};

	const onRemove = () => {
		if (seats <= 0) return;
		if (used > total - 1) {
			toast.error(
				"Delete or transfer a workspace first — you're using all of them.",
			);
			return;
		}
		const id = toast.loading("Releasing seat…");
		startTransition(async () => {
			try {
				const result = await releaseWorkspaceSeats(1);
				setSeats(result.canceledAtPeriodEnd ? 0 : result.seats);
				toast.success(
					result.canceledAtPeriodEnd
						? "Workspace add-on set to cancel at period end."
						: `Seat count now ${result.seats}.`,
					{ id },
				);
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Couldn't remove seat.",
					{ id },
				);
			}
		});
	};

	return (
		<AddonRow
			label="Workspaces"
			helper={`Empty tenant — buy channels and assign seats per workspace from its own settings. $${monthlyPerSeat}/mo${interval === "year" ? " (billed yearly)" : ""}.`}
			used={used}
			total={total}
			remaining={remaining}
			extra={seats > 0 ? `${seats} add-on seat${seats === 1 ? "" : "s"}` : null}
			pending={pending}
			canRemove={seats > 0}
			addLabel={`Add seat (+$${monthlyPerSeat}/mo)`}
			onAdd={onAdd}
			onRemove={onRemove}
		/>
	);
}

function SeatRow({
	included,
	addonSeats,
	used,
	pendingInvites,
	monthlyPerSeat,
	interval,
}: Props["seat"] & { interval: "month" | "year" }) {
	const [pending, startTransition] = useTransition();
	const [seats, setSeats] = useState(addonSeats);
	const total = included + seats;
	const inUse = used + pendingInvites;
	const remaining = Math.max(0, total - inUse);

	const onAdd = () => {
		const id = toast.loading("Opening checkout…");
		startTransition(async () => {
			try {
				const result = await buyMemberSeats(1);
				if (result.kind === "checkout") {
					toast.dismiss(id);
					window.location.href = result.url;
				} else {
					setSeats(result.seats);
					toast.success("Added 1 seat.", { id });
				}
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Couldn't add seat.",
					{ id },
				);
			}
		});
	};

	const onRemove = () => {
		if (seats <= 0) return;
		if (inUse > total - 1) {
			toast.error("Remove a teammate first — you're using all allocated seats.");
			return;
		}
		const id = toast.loading("Releasing seat…");
		startTransition(async () => {
			try {
				const result = await releaseMemberSeats(1);
				setSeats(result.canceledAtPeriodEnd ? 0 : result.seats);
				toast.success(
					result.canceledAtPeriodEnd
						? "Seat add-on set to cancel at period end."
						: `Seat count now ${result.seats}.`,
					{ id },
				);
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Couldn't remove seat.",
					{ id },
				);
			}
		});
	};

	const extras = [
		pendingInvites > 0 ? `${pendingInvites} pending` : null,
		seats > 0 ? `${seats} add-on seat${seats === 1 ? "" : "s"}` : null,
	]
		.filter(Boolean)
		.join(" · ");

	return (
		<AddonRow
			label="Seats"
			helper={`${included} included in your plan — one seat per human, shared across every workspace you own. Extra seats are $${monthlyPerSeat}/mo${interval === "year" ? " (billed yearly)" : ""}.`}
			used={inUse}
			total={total}
			remaining={remaining}
			extra={extras || null}
			pending={pending}
			canRemove={seats > 0}
			addLabel={`Add seat (+$${monthlyPerSeat}/mo)`}
			onAdd={onAdd}
			onRemove={onRemove}
		/>
	);
}

function AddonRow({
	label,
	helper,
	used,
	total,
	remaining,
	extra,
	pending,
	canRemove,
	addLabel,
	onAdd,
	onRemove,
}: {
	label: string;
	helper: string;
	used: number;
	total: number;
	remaining: number;
	extra: string | null;
	pending: boolean;
	canRemove: boolean;
	addLabel: string;
	onAdd: () => void;
	onRemove: () => void;
}) {
	return (
		<div className="px-6 lg:px-8 py-6 grid md:grid-cols-[260px_1fr] gap-6 items-center">
			<div>
				<p className="font-display text-[18px] leading-[1.2] tracking-[-0.005em] text-ink">
					{label}
				</p>
				<p className="mt-1.5 text-[12px] text-ink/60 leading-normal">
					{helper}
				</p>
			</div>
			<div className="flex flex-wrap items-center gap-3">
				<div className="flex items-baseline gap-2 mr-auto">
					<span className="font-display text-[26px] leading-none tracking-[-0.015em] text-ink tabular-nums">
						{used}
					</span>
					<span className="text-[12.5px] text-ink/55">
						of {total} in use
						{extra ? <span className="text-ink/40"> · {extra}</span> : null}
					</span>
					{remaining > 0 ? (
						<span className="ml-2 inline-flex items-center h-6 px-2 rounded-full bg-peach-100/70 text-[11px] text-ink">
							{remaining} free
						</span>
					) : null}
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={onRemove}
						disabled={pending || !canRemove}
						className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-border text-[12.5px] text-ink/75 hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
					>
						<Minus className="w-3.5 h-3.5" />
						Remove
					</button>
					<button
						type="button"
						onClick={onAdd}
						disabled={pending}
						className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-ink text-background text-[12.5px] font-medium hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
					>
						<Plus className="w-3.5 h-3.5" />
						{addLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
