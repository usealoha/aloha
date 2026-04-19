// Deletes a Facebook page post via `DELETE /{post-id}` using the page
// access token (same path the publisher uses to create the post). The
// user's linked page is resolved from the `/me/accounts` endpoint.
//
// Note: Facebook page posts have composite IDs like `{pageId}_{postId}`.
// The Graph API accepts either the composite id or the trailing postId
// against the page-access-token — we pass what we stored as remotePostId.

import { PublishError, categorizeHttpStatus } from "@/lib/publishers/errors";
import {
	forceRefresh,
	getFreshToken,
	type ProviderAccount,
} from "@/lib/publishers/tokens";

type FacebookPage = {
	id: string;
	access_token: string;
};

async function getPageToken(account: ProviderAccount): Promise<string> {
	const res = await fetch(
		`https://graph.facebook.com/v19.0/me/accounts?access_token=${account.accessToken}`,
	);
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Facebook get pages failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
	const json = (await res.json()) as { data?: FacebookPage[] };
	const page = json.data?.[0];
	if (!page) {
		throw new PublishError(
			"needs_reauth",
			"No Facebook page linked to this account.",
		);
	}
	return page.access_token;
}

async function callDelete(
	pageAccessToken: string,
	remotePostId: string,
): Promise<Response> {
	return fetch(
		`https://graph.facebook.com/v19.0/${encodeURIComponent(remotePostId)}?access_token=${pageAccessToken}`,
		{ method: "DELETE" },
	);
}

export async function unpublishFromFacebook(args: {
	userId: string;
	remotePostId: string;
}): Promise<void> {
	let account = await getFreshToken(args.userId, "facebook");
	let pageToken = await getPageToken(account);
	let res = await callDelete(pageToken, args.remotePostId);

	if (res.status === 401) {
		account = await forceRefresh(args.userId, "facebook");
		pageToken = await getPageToken(account);
		res = await callDelete(pageToken, args.remotePostId);
	}

	if (res.status === 404) return;

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Facebook delete failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
}
