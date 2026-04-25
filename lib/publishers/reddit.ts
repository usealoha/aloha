import type { PostMedia } from "@/db/schema";
import { categorizeHttpStatus, PublishError } from "./errors";
import { forceRefresh, getFreshToken, type ProviderAccount } from "./tokens";

export type RedditPostResult = {
	remotePostId: string;
	remoteUrl: string;
};

export type RedditCommentResult = {
	remotePostId: string;
	remoteUrl: string;
};

export type RedditDMResult = {
	remotePostId: string;
	remoteUrl: string;
};

async function getRedditUsername(accessToken: string): Promise<string> {
	const res = await fetch("https://oauth.reddit.com/api/v1/me", {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});
	if (!res.ok) {
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Reddit userinfo failed (${res.status})`,
		);
	}
	const json = (await res.json()) as { name: string };
	return json.name;
}

async function uploadMedia(
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

	const res = await fetch("https://oauth.reddit.com/api/media_upload.json", {
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
			`Reddit media upload failed (${res.status}): ${detail.slice(0, 300)}`,
		);
	}

	const json = (await res.json()) as { id: string; src: string };
	return json.id;
}

// Reddit's image / video submit endpoint expects a public URL hosted on
// Reddit's own asset bucket. This is a two-step lease flow: ask Reddit
// for a presigned S3 upload, push the bytes, then return the asset URL
// for use as the post's `url` field.
async function leaseAndUploadAsset(
	accessToken: string,
	media: PostMedia,
): Promise<string> {
	const filename = media.url.split("/").pop()?.split("?")[0] ?? "upload";
	const leaseForm = new URLSearchParams();
	leaseForm.set("filepath", filename);
	leaseForm.set("mimetype", media.mimeType);

	const leaseRes = await fetch(
		"https://oauth.reddit.com/api/media/asset.json",
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: leaseForm.toString(),
		},
	);
	if (!leaseRes.ok) {
		const detail = await leaseRes.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(leaseRes.status),
			`Reddit asset lease failed (${leaseRes.status}): ${detail.slice(0, 300)}`,
		);
	}
	const lease = (await leaseRes.json()) as {
		args: {
			action: string;
			fields: Array<{ name: string; value: string }>;
		};
		asset: { asset_id: string };
	};

	const action = lease.args.action.startsWith("//")
		? `https:${lease.args.action}`
		: lease.args.action;

	const bin = await fetch(media.url);
	if (!bin.ok) {
		throw new PublishError(
			"transient",
			`Could not fetch media (${bin.status}) from ${media.url}`,
		);
	}
	const blob = await bin.blob();

	const form = new FormData();
	for (const f of lease.args.fields) form.append(f.name, f.value);
	form.append("file", blob, filename);

	const uploadRes = await fetch(action, { method: "POST", body: form });
	if (!uploadRes.ok && uploadRes.status !== 201) {
		const detail = await uploadRes.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(uploadRes.status),
			`Reddit asset upload failed (${uploadRes.status}): ${detail.slice(0, 300)}`,
		);
	}

	// Asset URL is constructed from the action host + the asset id. The
	// presigned action is the public bucket itself, so this URL is what
	// /api/submit accepts as `url` for kind=image|video.
	return `${action.replace(/\/$/, "")}/${lease.asset.asset_id}`;
}

type SubmitInput = {
	subreddit: string;
	kind: "self" | "link" | "image" | "video";
	title: string;
	text?: string;
	url?: string;
	flairId?: string;
	flairText?: string;
	nsfw?: boolean;
	spoiler?: boolean;
	sendReplies?: boolean;
};

async function submitToReddit(
	accessToken: string,
	input: SubmitInput,
): Promise<{ id: string; url: string }> {
	const form = new URLSearchParams();
	form.set("api_type", "json");
	form.set("kind", input.kind);
	form.set("sr", input.subreddit);
	form.set("title", input.title.slice(0, 300));
	if (input.kind === "self" && input.text) form.set("text", input.text);
	if (input.kind === "link" && input.url) form.set("url", input.url);
	if (input.kind === "image" && input.url) {
		form.set("url", input.url);
	}
	if (input.kind === "video" && input.url) {
		form.set("url", input.url);
		form.set("video_poster_url", input.url);
	}
	if (input.flairId) form.set("flair_id", input.flairId);
	if (input.flairText) form.set("flair_text", input.flairText);
	if (input.nsfw) form.set("nsfw", "true");
	if (input.spoiler) form.set("spoiler", "true");
	form.set("sendreplies", String(input.sendReplies ?? true));
	form.set("resubmit", "true");

	const res = await fetch("https://oauth.reddit.com/api/submit", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: form.toString(),
	});
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Reddit submit failed (${res.status}): ${detail.slice(0, 300)}`,
		);
	}
	const json = (await res.json()) as {
		json: {
			errors?: Array<[string, string, string?]>;
			data?: { id?: string; url?: string; name?: string };
		};
	};
	if (json.json.errors && json.json.errors.length > 0) {
		const [, message] = json.json.errors[0];
		throw new PublishError("invalid_content", `Reddit rejected post: ${message}`);
	}
	const id =
		json.json.data?.id ?? json.json.data?.name?.replace(/^t3_/, "") ?? "";
	const url = json.json.data?.url ?? `https://www.reddit.com/r/${input.subreddit}/comments/${id}`;
	if (!id) {
		throw new PublishError("transient", "Reddit submit returned no post id");
	}
	return { id, url };
}

async function createComment(
	accessToken: string,
	parentId: string,
	text: string,
): Promise<{ id: string; url: string }> {
	const res = await fetch("https://oauth.reddit.com/api/comment", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			api_type: "json",
			text,
			parent_id: parentId,
		}),
	});

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Reddit comment failed (${res.status}): ${detail.slice(0, 300)}`,
		);
	}

	const json = (await res.json()) as {
		json: {
			data: {
				id: string;
				parents: Record<string, { id: string; children: string[] }>;
			};
		};
	};

	const commentId = json.json.data.id;
	const parentData = Object.values(json.json.data.parents)[0];
	const postId = parentData?.id ?? commentId;

	return {
		id: commentId,
		url: `https://www.reddit.com/r/${postId}/_/${commentId}`,
	};
}

async function sendDM(
	accessToken: string,
	to: string,
	text: string,
): Promise<{ id: string }> {
	const res = await fetch("https://oauth.reddit.com/api/compose", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			api_type: "json",
			text,
			to,
		}),
	});

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Reddit DM failed (${res.status}): ${detail.slice(0, 300)}`,
		);
	}

	const json = (await res.json()) as {
		json: {
			data: {
				id: string;
			};
		};
	};

	return {
		id: json.json.data.id,
	};
}

function deriveTitle(text: string): string {
	const firstLine = text.split("\n").find((l) => l.trim().length > 0) ?? "";
	return firstLine.trim().slice(0, 300) || "Untitled";
}

async function getAccount(workspaceId: string): Promise<ProviderAccount> {
	try {
		return await getFreshToken(workspaceId, "reddit");
	} catch (err) {
		if (err instanceof PublishError && err.category === "needs_reauth") {
			return forceRefresh(workspaceId, "reddit");
		}
		throw err;
	}
}

// Legacy multi-channel-fanout publisher. Title is derived from the first
// non-empty line of text; the rest becomes selftext. Subreddit is
// required by Reddit, so callers without one will hit invalid_content.
export async function publishToReddit(args: {
	workspaceId: string;
	text: string;
	media?: PostMedia[];
	subreddit?: string;
}): Promise<RedditPostResult> {
	if (!args.subreddit) {
		throw new PublishError(
			"invalid_content",
			"Reddit posts require a target subreddit. Use Studio to set one.",
		);
	}
	const account = await getAccount(args.workspaceId);
	const lines = args.text.split("\n");
	const title = deriveTitle(args.text);
	const body = lines.slice(1).join("\n").trimStart();
	const { id, url } = await submitToReddit(account.accessToken, {
		subreddit: args.subreddit,
		kind: "self",
		title,
		text: body,
	});
	return { remotePostId: id, remoteUrl: url };
}

export type RedditSubmitArgs = {
	workspaceId: string;
	subreddit: string;
	title: string;
	flairId?: string;
	nsfw?: boolean;
	spoiler?: boolean;
};

export async function publishRedditText(
	args: RedditSubmitArgs & { body: string },
): Promise<RedditPostResult> {
	const account = await getAccount(args.workspaceId);
	const { id, url } = await submitToReddit(account.accessToken, {
		kind: "self",
		subreddit: args.subreddit,
		title: args.title,
		text: args.body,
		flairId: args.flairId,
		nsfw: args.nsfw,
		spoiler: args.spoiler,
	});
	return { remotePostId: id, remoteUrl: url };
}

export async function publishRedditLink(
	args: RedditSubmitArgs & { url: string },
): Promise<RedditPostResult> {
	const account = await getAccount(args.workspaceId);
	const { id, url } = await submitToReddit(account.accessToken, {
		kind: "link",
		subreddit: args.subreddit,
		title: args.title,
		url: args.url,
		flairId: args.flairId,
		nsfw: args.nsfw,
		spoiler: args.spoiler,
	});
	return { remotePostId: id, remoteUrl: url };
}

export async function publishRedditImage(
	args: RedditSubmitArgs & { image: PostMedia },
): Promise<RedditPostResult> {
	const account = await getAccount(args.workspaceId);
	const assetUrl = await leaseAndUploadAsset(account.accessToken, args.image);
	const { id, url } = await submitToReddit(account.accessToken, {
		kind: "image",
		subreddit: args.subreddit,
		title: args.title,
		url: assetUrl,
		flairId: args.flairId,
		nsfw: args.nsfw,
		spoiler: args.spoiler,
	});
	return { remotePostId: id, remoteUrl: url };
}

export async function publishRedditVideo(
	args: RedditSubmitArgs & { video: PostMedia },
): Promise<RedditPostResult> {
	const account = await getAccount(args.workspaceId);
	const assetUrl = await leaseAndUploadAsset(account.accessToken, args.video);
	const { id, url } = await submitToReddit(account.accessToken, {
		kind: "video",
		subreddit: args.subreddit,
		title: args.title,
		url: assetUrl,
		flairId: args.flairId,
		nsfw: args.nsfw,
		spoiler: args.spoiler,
	});
	return { remotePostId: id, remoteUrl: url };
}

export async function commentOnReddit(args: {
	workspaceId: string;
	parentId: string;
	text: string;
}): Promise<RedditCommentResult> {
	let account: ProviderAccount;
	try {
		account = await getFreshToken(args.workspaceId, "reddit");
	} catch (err) {
		if (err instanceof PublishError && err.category === "needs_reauth") {
			account = await forceRefresh(args.workspaceId, "reddit");
		} else {
			throw err;
		}
	}

	const { id, url } = await createComment(
		account.accessToken,
		args.parentId,
		args.text,
	);

	return {
		remotePostId: id,
		remoteUrl: url,
	};
}

export async function sendRedditDM(args: {
	workspaceId: string;
	to: string;
	text: string;
}): Promise<RedditDMResult> {
	let account: ProviderAccount;
	try {
		account = await getFreshToken(args.workspaceId, "reddit");
	} catch (err) {
		if (err instanceof PublishError && err.category === "needs_reauth") {
			account = await forceRefresh(args.workspaceId, "reddit");
		} else {
			throw err;
		}
	}

	const { id } = await sendDM(account.accessToken, args.to, args.text);

	return {
		remotePostId: id,
		remoteUrl: `https://www.reddit.com/message/messages/${id}`,
	};
}
