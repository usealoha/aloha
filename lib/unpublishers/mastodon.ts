// Deletes a Mastodon status via `DELETE /api/v1/statuses/:id`. Instance URL
// and access token come from the mastodon_credentials row. Note the v1
// delete endpoint returns the deleted status's source — we don't use the
// response body.

import { PublishError, categorizeHttpStatus } from "@/lib/publishers/errors";
import { getMastodonCredentials } from "@/lib/publishers/mastodon";

export async function unpublishFromMastodon(args: {
	userId: string;
	remotePostId: string;
}): Promise<void> {
	const credentials = await getMastodonCredentials(args.userId);
	const url = `${credentials.instanceUrl.replace(/\/$/, "")}/api/v1/statuses/${args.remotePostId}`;
	const res = await fetch(url, {
		method: "DELETE",
		headers: { Authorization: `Bearer ${credentials.accessToken}` },
	});

	if (res.status === 404) return;

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Mastodon delete failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
}
