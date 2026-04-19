// Deletes a LinkedIn ugcPost via `DELETE /v2/ugcPosts/{urn}`. URNs contain
// colons and must be URL-encoded. Requires the same `w_member_social` scope
// used for publishing.

import { PublishError, categorizeHttpStatus } from "@/lib/publishers/errors";
import {
	forceRefresh,
	getFreshToken,
	type ProviderAccount,
} from "@/lib/publishers/tokens";

async function callDelete(
	account: ProviderAccount,
	urn: string,
): Promise<Response> {
	return fetch(
		`https://api.linkedin.com/v2/ugcPosts/${encodeURIComponent(urn)}`,
		{
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${account.accessToken}`,
				"X-Restli-Protocol-Version": "2.0.0",
			},
		},
	);
}

export async function unpublishFromLinkedIn(args: {
	userId: string;
	remotePostId: string;
}): Promise<void> {
	let account = await getFreshToken(args.userId, "linkedin");
	let res = await callDelete(account, args.remotePostId);

	if (res.status === 401) {
		account = await forceRefresh(args.userId, "linkedin");
		res = await callDelete(account, args.remotePostId);
	}

	// 404 = post already gone. Idempotent success.
	if (res.status === 404) return;

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`LinkedIn delete failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
}
