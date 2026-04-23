// Deletes a Pinterest pin via `DELETE /v5/pins/{pin_id}`. Same OAuth flow
// as the publisher — refresh on 401, surface categorized errors.

import { PublishError, categorizeHttpStatus } from "@/lib/publishers/errors";
import {
	forceRefresh,
	getFreshToken,
	type ProviderAccount,
} from "@/lib/publishers/tokens";

async function callDelete(
	account: ProviderAccount,
	pinId: string,
): Promise<Response> {
	return fetch(`https://api.pinterest.com/v5/pins/${pinId}`, {
		method: "DELETE",
		headers: { Authorization: `Bearer ${account.accessToken}` },
	});
}

export async function unpublishFromPinterest(args: {
	workspaceId: string;
	remotePostId: string;
}): Promise<void> {
	let account = await getFreshToken(args.workspaceId, "pinterest");
	let res = await callDelete(account, args.remotePostId);

	if (res.status === 401) {
		account = await forceRefresh(args.workspaceId, "pinterest");
		res = await callDelete(account, args.remotePostId);
	}

	if (res.status === 404) return;

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Pinterest delete failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
}
