// Deletes a Reddit submission via `POST /api/del`. Reddit's "fullname"
// format prefixes the base36 id with `t3_` for links / self-posts. The
// publisher only creates submissions (not comments), so every id we have
// in post_deliveries corresponds to a t3_ thing.
//
// Scope required: `edit` (already requested at connect time).

import { PublishError, categorizeHttpStatus } from "@/lib/publishers/errors";
import {
	forceRefresh,
	getFreshToken,
	type ProviderAccount,
} from "@/lib/publishers/tokens";

async function callDelete(
	account: ProviderAccount,
	fullname: string,
): Promise<Response> {
	const body = new URLSearchParams({ id: fullname });
	return fetch("https://oauth.reddit.com/api/del", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${account.accessToken}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body,
	});
}

export async function unpublishFromReddit(args: {
	workspaceId: string;
	remotePostId: string;
}): Promise<void> {
	const fullname = args.remotePostId.startsWith("t3_")
		? args.remotePostId
		: `t3_${args.remotePostId}`;

	let account = await getFreshToken(args.workspaceId, "reddit");
	let res = await callDelete(account, fullname);

	if (res.status === 401) {
		account = await forceRefresh(args.workspaceId, "reddit");
		res = await callDelete(account, fullname);
	}

	// Reddit's /api/del returns 200 even for already-deleted or non-existent
	// things — the call is idempotent by design, so we don't need a 404 branch.
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Reddit delete failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
}
