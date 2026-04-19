// Deletes a Threads post via `DELETE /{threads-media-id}` on the Threads
// Graph API. Scope required: `threads_manage_insights` + `threads_delete`
// (or equivalent). Accounts connected before these scopes existed will
// 403 and surface as needs_reauth so the user re-links.

import { PublishError, categorizeHttpStatus } from "@/lib/publishers/errors";
import {
	forceRefresh,
	getFreshToken,
	type ProviderAccount,
} from "@/lib/publishers/tokens";

async function callDelete(
	account: ProviderAccount,
	mediaId: string,
): Promise<Response> {
	return fetch(
		`https://graph.threads.net/v1.0/${encodeURIComponent(mediaId)}?access_token=${account.accessToken}`,
		{ method: "DELETE" },
	);
}

export async function unpublishFromThreads(args: {
	userId: string;
	remotePostId: string;
}): Promise<void> {
	let account = await getFreshToken(args.userId, "threads");
	let res = await callDelete(account, args.remotePostId);

	if (res.status === 401) {
		account = await forceRefresh(args.userId, "threads");
		res = await callDelete(account, args.remotePostId);
	}

	if (res.status === 404) return;

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		const category =
			res.status === 403
				? "needs_reauth"
				: categorizeHttpStatus(res.status);
		throw new PublishError(
			category,
			`Threads delete failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
}
