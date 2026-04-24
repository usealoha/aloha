"use server";

import { revalidatePath } from "next/cache";
import { ROLES } from "@/lib/workspaces/roles";
import { assertRole } from "@/lib/workspaces/assert-role";
import {
	addMemberAddonSeats,
	addWorkspaceAddonSeats,
	removeMemberAddonSeats,
	removeWorkspaceAddonSeats,
	type AddonPurchaseResult,
} from "@/lib/billing/addons";

// All four actions require ADMIN on the active workspace. Owners pay,
// admins can adjust seat counts — matches existing billing UX where
// admins can flip Muse on/off or change channel seat counts.

export async function buyWorkspaceSeats(count: number): Promise<AddonPurchaseResult> {
	const ctx = await assertRole(ROLES.ADMIN);
	if (!Number.isInteger(count) || count < 1) {
		throw new Error("Count must be a positive integer.");
	}
	const result = await addWorkspaceAddonSeats(ctx.user.id, count);
	revalidatePath("/app/settings/billing");
	revalidatePath("/app", "layout");
	return result;
}

export async function releaseWorkspaceSeats(
	count: number,
): Promise<{ seats: number; canceledAtPeriodEnd: boolean }> {
	const ctx = await assertRole(ROLES.ADMIN);
	if (!Number.isInteger(count) || count < 1) {
		throw new Error("Count must be a positive integer.");
	}
	const result = await removeWorkspaceAddonSeats(ctx.user.id, count);
	revalidatePath("/app/settings/billing");
	revalidatePath("/app", "layout");
	return result;
}

export async function buyMemberSeats(
	workspaceId: string,
	count: number,
): Promise<AddonPurchaseResult> {
	const ctx = await assertRole(ROLES.ADMIN);
	// Member seats are per-workspace and can only be bought for the
	// active workspace — avoids cross-tenant misuse where an admin in
	// workspace A tries to spend on workspace B.
	if (workspaceId !== ctx.workspace.id) {
		throw new Error("Can only buy seats for the active workspace.");
	}
	if (!Number.isInteger(count) || count < 1) {
		throw new Error("Count must be a positive integer.");
	}
	const result = await addMemberAddonSeats(ctx.user.id, workspaceId, count);
	revalidatePath("/app/settings/billing");
	revalidatePath("/app/settings/members");
	return result;
}

export async function releaseMemberSeats(
	workspaceId: string,
	count: number,
): Promise<{ seats: number; canceledAtPeriodEnd: boolean }> {
	const ctx = await assertRole(ROLES.ADMIN);
	if (workspaceId !== ctx.workspace.id) {
		throw new Error("Can only release seats for the active workspace.");
	}
	if (!Number.isInteger(count) || count < 1) {
		throw new Error("Count must be a positive integer.");
	}
	const result = await removeMemberAddonSeats(ctx.user.id, workspaceId, count);
	revalidatePath("/app/settings/billing");
	revalidatePath("/app/settings/members");
	return result;
}
