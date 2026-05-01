// Thin gating façade over getAccountEntitlements + getWorkspaceQuota.
// Server-action guards and UI affordances call these to get an
// allow/deny + reason string without re-deriving the arithmetic.
//
// See lib/billing/account-entitlements.ts for the actual subscription
// aggregation. This module just projects the quota into the
// allow/deny shape the caller needs.

import {
	getAccountEntitlements,
	getAccountSeats,
} from "./account-entitlements";

export type WorkspaceCreationEntitlement = {
	allowed: boolean;
	ownedCount: number;
	limit: number; // Infinity when add-on seats are effectively unbounded
	isPaid: boolean;
	reason?: string;
};

// Account-level seat entitlement. Replaces the old per-workspace
// WorkspaceMemberEntitlement: one seat = one human across the whole
// account, not per-workspace.
export type AccountSeatEntitlement = {
	allowed: boolean;
	current: number; // members + pending invites (distinct heads)
	members: number;
	pendingInvites: number;
	limit: number;
	isPaid: boolean;
	reason?: string;
};

export async function getWorkspaceCreationEntitlement(
	userId: string,
): Promise<WorkspaceCreationEntitlement> {
	const ent = await getAccountEntitlements(userId);
	const { workspaces } = ent;
	const allowed = workspaces.used < workspaces.total;

	let reason: string | undefined;
	if (!allowed) {
		reason = ent.isPaid
			? `You've used all ${workspaces.total} workspace${workspaces.total === 1 ? "" : "s"} included on your plan. Add more workspaces from billing.`
			: `Free plan is limited to ${workspaces.total} workspace. Upgrade to add more.`;
	}

	return {
		allowed,
		ownedCount: workspaces.used,
		limit: workspaces.total,
		isPaid: ent.isPaid,
		reason,
	};
}

// Returns the seat allowance/usage for a workspace owner's whole account.
// Pass the OWNER's userId — not the inviter's — so seat math reflects the
// person who pays. Callers in invite/accept flows should resolve the
// workspace's owner first.
export async function getAccountSeatEntitlement(
	ownerUserId: string,
): Promise<AccountSeatEntitlement> {
	const [seats, ent] = await Promise.all([
		getAccountSeats(ownerUserId),
		getAccountEntitlements(ownerUserId),
	]);
	const allowed = seats.remaining > 0;

	let reason: string | undefined;
	if (!allowed) {
		reason = ent.isPaid
			? `Account is at its ${seats.total}-seat cap. Add seats from billing to invite more.`
			: `Free plan is limited to ${seats.total} seats. Upgrade to add more.`;
	}

	return {
		allowed,
		current: seats.consumed,
		members: seats.used,
		pendingInvites: seats.pendingInvites,
		limit: seats.total,
		isPaid: ent.isPaid,
		reason,
	};
}
