import type { PostMedia } from "@/db/schema";
import { categorizeHttpStatus, PublishError } from "./errors";
import { forceRefresh, getFreshToken, type ProviderAccount } from "./tokens";

export type ThreadsPostResult = {
	remotePostId: string;
	remoteUrl: string;
};

type ThreadsUser = {
	id: string;
	username: string;
};

async function resolveThreadsProfile(
	account: ProviderAccount,
): Promise<{ user: ThreadsUser; pageAccessToken: string }> {
	const res = await fetch(
		`https://graph.facebook.com/v19.0/me/accounts?access_token=${account.accessToken}`,
	);
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Facebook pages fetch failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
	const pages = (await res.json()) as {
		data?: Array<{ id: string; name: string; access_token: string }>;
	};
	const page = pages.data?.[0];
	if (!page) {
		throw new PublishError(
			"forbidden",
			"No Facebook Page found. Threads requires a linked Instagram business account.",
		);
	}

	const igRes = await fetch(
		`https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
	);
	const igData = (await igRes.json()) as {
		instagram_business_account?: { id: string; username: string };
	};
	if (!igData.instagram_business_account) {
		throw new PublishError(
			"forbidden",
			"No Instagram business account linked. Threads requires Instagram business/creator.",
		);
	}

	const threadsRes = await fetch(
		`https://graph.facebook.com/v19.0/${igData.instagram_business_account.id}?fields=threads_profile&access_token=${page.access_token}`,
	);
	const threadsData = (await threadsRes.json()) as {
		threads_profile?: { id: string; username: string };
	};
	if (!threadsData.threads_profile) {
		throw new PublishError(
			"forbidden",
			"No Threads profile found. Create one in the Threads app first.",
		);
	}
	return {
		user: {
			id: threadsData.threads_profile.id,
			username: threadsData.threads_profile.username,
		},
		pageAccessToken: page.access_token,
	};
}

async function getThreadsUser(
	account: ProviderAccount,
): Promise<ThreadsUser> {
	const res = await fetch(
		`https://graph.facebook.com/v19.0/me/accounts?access_token=${account.accessToken}`,
	);
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Facebook pages fetch failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
	const pages = (await res.json()) as {
		data?: Array<{ id: string; name: string; access_token: string }>;
	};
	const page = pages.data?.[0];
	if (!page) {
		throw new PublishError(
			"forbidden",
			"No Facebook Page found. Threads requires a linked Instagram business account.",
		);
	}

	const igRes = await fetch(
		`https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
	);
	if (!igRes.ok) {
		const detail = await igRes.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(igRes.status),
			`Instagram business account fetch failed (${igRes.status}): ${detail.slice(0, 400)}`,
		);
	}
	const igData = (await igRes.json()) as {
		instagram_business_account?: { id: string; username: string };
	};
	const igAccount = igData.instagram_business_account;
	if (!igAccount) {
		throw new PublishError(
			"forbidden",
			"No Instagram business account linked. Threads requires Instagram business/creator.",
		);
	}

	const threadsRes = await fetch(
		`https://graph.facebook.com/v19.0/${igAccount.id}?fields=threads_profile&access_token=${page.access_token}`,
	);
	if (!threadsRes.ok) {
		const detail = await threadsRes.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(threadsRes.status),
			`Threads profile fetch failed (${threadsRes.status}): ${detail.slice(0, 400)}`,
		);
	}
	const threadsData = (await threadsRes.json()) as {
		threads_profile?: { id: string; username: string };
	};
	if (!threadsData.threads_profile) {
		throw new PublishError(
			"forbidden",
			"No Threads profile found. Create one in the Threads app first.",
		);
	}
	return { id: threadsData.threads_profile.id, username: threadsData.threads_profile.username };
}

async function createThreadsTextPost(
	threadsUserId: string,
	pageAccessToken: string,
	text: string,
	replyToId?: string,
): Promise<{ id: string; url: string }> {
	const body: Record<string, unknown> = { text };
	if (replyToId) body.reply_to_id = replyToId;
	const res = await fetch(
		`https://graph.facebook.com/v19.0/${threadsUserId}/threads?access_token=${pageAccessToken}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		},
	);
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Threads post failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
	const json = (await res.json()) as { id?: string };
	const id = json.id;
	if (!id) {
		throw new PublishError("transient", "Threads post returned no id");
	}
	return { id, url: `https://www.threads.net/@${threadsUserId}/post/${id}` };
}

async function createThreadsImagePost(
	threadsUserId: string,
	pageAccessToken: string,
	mediaUrl: string,
	mimeType: string,
	caption: string,
	replyToId?: string,
): Promise<{ id: string; url: string }> {
	const imageRes = await fetch(mediaUrl);
	if (!imageRes.ok) {
		throw new PublishError(
			"transient",
			`Could not fetch uploaded media (${imageRes.status}) from ${mediaUrl}`,
		);
	}
	const imageBlob = await imageRes.blob();

	const form = new FormData();
	form.append("image", imageBlob, "upload");
	form.append("caption", caption);
	if (replyToId) form.append("reply_to_id", replyToId);

	const uploadRes = await fetch(
		`https://graph.facebook.com/v19.0/${threadsUserId}/threads_media?access_token=${pageAccessToken}`,
		{
			method: "POST",
			body: form,
		},
	);
	if (!uploadRes.ok) {
		const detail = await uploadRes.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(uploadRes.status),
			`Threads image upload failed (${uploadRes.status}): ${detail.slice(0, 400)}`,
		);
	}
	const uploadJson = (await uploadRes.json()) as { id?: string };
	const mediaId = uploadJson.id;
	if (!mediaId) {
		throw new PublishError("transient", "Threads image upload returned no id");
	}

	const publishRes = await fetch(
		`https://graph.facebook.com/v19.0/${threadsUserId}/threads_media_publish?access_token=${pageAccessToken}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ creation_id: mediaId }),
		},
	);
	if (!publishRes.ok) {
		const detail = await publishRes.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(publishRes.status),
			`Threads media publish failed (${publishRes.status}): ${detail.slice(0, 400)}`,
		);
	}
	const publishJson = (await publishRes.json()) as { id?: string };
	const id = publishJson.id;
	if (!id) {
		throw new PublishError("transient", "Threads media publish returned no id");
	}
	return { id, url: `https://www.threads.net/@${threadsUserId}/post/${id}` };
}

export async function publishToThreads(args: {
	workspaceId: string;
	text: string;
	media?: PostMedia[];
}): Promise<ThreadsPostResult> {
	let account = await getFreshToken(args.workspaceId, "threads");

	let threadsUser: ThreadsUser;
	let pageAccessToken: string;

	try {
		const res = await fetch(
			`https://graph.facebook.com/v19.0/me/accounts?access_token=${account.accessToken}`,
		);
		const pages = (await res.json()) as {
			data?: Array<{ id: string; access_token: string }>;
		};
		const page = pages.data?.[0];
		if (!page) {
			throw new PublishError(
				"forbidden",
				"No Facebook Page found.",
			);
		}
		pageAccessToken = page.access_token;

		const igRes = await fetch(
			`https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
		);
		const igData = (await igRes.json()) as {
			instagram_business_account?: { id: string; username: string };
		};
		if (!igData.instagram_business_account) {
			throw new PublishError(
				"forbidden",
				"No Instagram business account linked.",
			);
		}

		const threadsRes = await fetch(
			`https://graph.facebook.com/v19.0/${igData.instagram_business_account.id}?fields=threads_profile&access_token=${page.access_token}`,
		);
		const threadsData = (await threadsRes.json()) as {
			threads_profile?: { id: string; username: string };
		};
		if (!threadsData.threads_profile) {
			throw new PublishError(
				"forbidden",
				"No Threads profile found.",
			);
		}
		threadsUser = {
			id: threadsData.threads_profile.id,
			username: threadsData.threads_profile.username,
		};
	} catch (err) {
		if (err instanceof PublishError && err.category === "needs_reauth") {
			account = await forceRefresh(args.workspaceId, "threads");
			throw err;
		}
		throw err;
	}

	const media = args.media ?? [];

	if (media.length === 0) {
		const post = await createThreadsTextPost(threadsUser.id, pageAccessToken, args.text);
		return { remotePostId: post.id, remoteUrl: post.url };
	}

	if (media.length === 1) {
		const post = await createThreadsImagePost(
			threadsUser.id,
			pageAccessToken,
			media[0].url,
			media[0].mimeType,
			args.text,
		);
		return { remotePostId: post.id, remoteUrl: post.url };
	}

	throw new PublishError(
		"invalid_content",
		"Threads supports up to 1 image per post.",
	);
}

// Post a connected thread on Threads. Each part chains via `reply_to_id`
// to the previous. Threads media currently supports 1 image per part, so
// extra media is ignored with a PublishError rather than silently dropped.
//
// Compensation note: Threads Graph API doesn't expose a documented delete
// endpoint for published posts, so mid-thread failures cannot roll back.
// The caller surfaces a partial-thread warning to the user.
export async function publishThreadsThread(args: {
	workspaceId: string;
	parts: { text: string; media?: PostMedia[] }[];
}): Promise<ThreadsPostResult> {
	if (args.parts.length === 0) {
		throw new PublishError("invalid_content", "Thread has no parts");
	}
	const account = await getFreshToken(args.workspaceId, "threads");
	const { user, pageAccessToken } = await resolveThreadsProfile(account);

	let replyTo: string | undefined;
	let headId: string | undefined;
	let headUrl: string | undefined;
	const posted: string[] = [];

	for (let i = 0; i < args.parts.length; i++) {
		const part = args.parts[i];
		const media = part.media ?? [];
		if (media.length > 1) {
			throw new PublishError(
				"invalid_content",
				"Threads supports up to 1 image per part.",
			);
		}

		try {
			const post =
				media.length === 1
					? await createThreadsImagePost(
							user.id,
							pageAccessToken,
							media[0].url,
							media[0].mimeType,
							part.text,
							replyTo,
						)
					: await createThreadsTextPost(
							user.id,
							pageAccessToken,
							part.text,
							replyTo,
						);
			posted.push(post.id);
			if (!headId) {
				headId = post.id;
				headUrl = post.url;
			}
			replyTo = post.id;
		} catch (err) {
			throw err instanceof PublishError
				? new PublishError(
						err.category,
						`${err.message} (posted ${posted.length} / ${args.parts.length} before failure; Threads has no delete API, remove manually if needed)`,
						err.cause,
					)
				: err;
		}
	}

	return { remotePostId: headId!, remoteUrl: headUrl! };
}