// Deletes a tweet via the X v2 API. Same auth flow as publishToX — refresh
// on 401, surface needs_reauth / transient categories so the dispatcher can
// treat them consistently.
//
// Scope required: `tweet.write` (already requested at connect time, so
// existing connections should work without a re-link).

import { PublishError, categorizeHttpStatus } from "@/lib/publishers/errors";
import {
	forceRefresh,
	getFreshToken,
	type ProviderAccount,
} from "@/lib/publishers/tokens";

async function callDeleteTweet(
	account: ProviderAccount,
	remotePostId: string,
): Promise<Response> {
	return fetch(`https://api.x.com/2/tweets/${remotePostId}`, {
		method: "DELETE",
		headers: { Authorization: `Bearer ${account.accessToken}` },
	});
}

export async function unpublishFromX(args: {
	workspaceId: string;
	remotePostId: string;
}): Promise<void> {
	let account = await getFreshToken(args.workspaceId, "twitter");
	let res = await callDeleteTweet(account, args.remotePostId);

	if (res.status === 401) {
		account = await forceRefresh(args.workspaceId, "twitter");
		res = await callDeleteTweet(account, args.remotePostId);
	}

	// X returns 404 when the tweet is already gone (user deleted it on the
	// platform, or a prior unpublish partially succeeded). Treat as success —
	// the desired end state (tweet not on X) is achieved.
	if (res.status === 404) return;

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`X delete failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
}
