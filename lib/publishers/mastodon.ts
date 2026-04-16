import { eq } from "drizzle-orm";
import type { PostMedia } from "@/db/schema";
import { db } from "@/db";
import { mastodonCredentials } from "@/db/schema";
import { PublishError, categorizeHttpStatus } from "./errors";

export type MastodonPostResult = {
	remotePostId: string;
	remoteUrl: string;
};

type MastodonCredentials = {
	instanceUrl: string;
	accessToken: string;
	accountId: string;
	username: string;
};

export async function getMastodonCredentials(userId: string): Promise<MastodonCredentials> {
	const [row] = await db
		.select({
			instanceUrl: mastodonCredentials.instanceUrl,
			accessToken: mastodonCredentials.accessToken,
			accountId: mastodonCredentials.accountId,
			username: mastodonCredentials.username,
		})
		.from(mastodonCredentials)
		.where(eq(mastodonCredentials.userId, userId))
		.limit(1);

	if (!row || !row.accessToken) {
		throw new PublishError(
			"needs_reauth",
			"Mastodon account not connected. Please connect your Mastodon account.",
		);
	}

	return {
		instanceUrl: row.instanceUrl,
		accessToken: row.accessToken,
		accountId: row.accountId,
		username: row.username,
	};
}

async function uploadMedia(
	instanceUrl: string,
	accessToken: string,
	media: PostMedia,
): Promise<string> {
	const bin = await fetch(media.url);
	if (!bin.ok) {
		throw new PublishError(
			"transient",
			`Could not fetch media (${bin.status}) from ${media.url}`,
		);
	}
	const bytes = await bin.arrayBuffer();

	const res = await fetch(`${instanceUrl}/api/v1/media`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": media.mimeType,
		},
		body: bytes,
	});

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Mastodon media upload failed (${res.status}): ${detail.slice(0, 300)}`,
		);
	}

	const json = (await res.json()) as { id: string };
	return json.id;
}

async function createStatus(
	instanceUrl: string,
	accessToken: string,
	username: string,
	text: string,
	mediaIds: string[],
): Promise<{ id: string; url: string }> {
	const res = await fetch(`${instanceUrl}/api/v1/statuses`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			status: text,
			media_ids: mediaIds,
			visibility: "public",
		}),
	});

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Mastodon post failed (${res.status}): ${detail.slice(0, 300)}`,
		);
	}

	const json = (await res.json()) as { id: string; url: string };
	return { id: json.id, url: json.url };
}

export async function publishToMastodon(args: {
	userId: string;
	text: string;
	media?: PostMedia[];
}): Promise<MastodonPostResult> {
	const credentials = await getMastodonCredentials(args.userId);

	const mediaIds: string[] = [];
	if (args.media && args.media.length > 0) {
		for (const m of args.media) {
			const id = await uploadMedia(credentials.instanceUrl, credentials.accessToken, m);
			mediaIds.push(id);
		}
	}

	const { id, url } = await createStatus(
		credentials.instanceUrl,
		credentials.accessToken,
		credentials.username,
		args.text,
		mediaIds,
	);

	return {
		remotePostId: id,
		remoteUrl: url,
	};
}