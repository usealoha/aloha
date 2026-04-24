// Guard for server actions that mutate workspace state (publish, invite,
// schedule, etc.). Layers on top of assertRole — role check happens first,
// then this ensures the workspace isn't frozen due to downgrade.
//
// Read-only flows (listing, rendering) don't call this; the data stays
// visible in frozen workspaces so the owner can choose between deleting
// it and re-buying the seat.

import { assertRole } from "./assert-role";
import type { CurrentContext, WorkspaceRole } from "@/lib/current-context";

// Separate from PermissionError (role mismatch): frozen state is a
// billing/quota condition, not a permission issue. UI layers catch this
// to show a tailored "workspace frozen, fix billing" message instead of
// a generic permission denied.
export class WorkspaceFrozenError extends Error {
	constructor() {
		super(
			"This workspace is frozen because the owner is over their seat allowance. Ask the owner to add seats or remove another workspace.",
		);
		this.name = "WorkspaceFrozenError";
	}
}

// Assert role AND ensure the active workspace isn't frozen. Use this
// for publish, invite, compose, and any other state-mutating action
// that should be paused while overage is unresolved.
export async function assertActive(
	required: readonly WorkspaceRole[],
): Promise<CurrentContext> {
	const ctx = await assertRole(required);
	if (ctx.workspace.frozenAt) throw new WorkspaceFrozenError();
	return ctx;
}
