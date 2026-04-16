import type { PostMedia } from "@/db/schema";
import { categorizeHttpStatus, PublishError } from "./errors";
import { forceRefresh, getFreshToken, type ProviderAccount } from "./tokens";

export type InstagramPostResult = {
	remotePostId: string;
	remoteUrl: string;
};

type IgUser = {
	id: string;
	username: string;
};

async function getInstagramBusinessAccount(
	account: ProviderAccount,
): Promise<IgUser> {
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
			"No Facebook Page found. Instagram business requires a linked Page.",
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
			"No Instagram business account linked. Convert to business/creator first.",
		);
	}
	return { id: igAccount.id, username: igAccount.username };
}

async function createMediaItem(
	igUserId: string,
	pageAccessToken: string,
	mediaUrl: string,
	mimeType: string,
	caption: string,
	isVideo: boolean,
): Promise<string> {
	const endpoint = isVideo
		? `https://graph.facebook.com/v19.0/${igUserId}/media_video`
		: `https://graph.facebook.com/v19.0/${igUserId}/media`;

	const form = new FormData();
	form.append("image_url", mediaUrl);
	form.append("caption", caption);

	const res = await fetch(`${endpoint}?access_token=${pageAccessToken}`, {
		method: "POST",
		body: form,
	});
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Instagram media creation failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
	const json = (await res.json()) as { id?: string };
	const id = json.id;
	if (!id) {
		throw new PublishError("transient", "Instagram media creation returned no id");
	}
	return id;
}

async function publishMediaItem(
	igUserId: string,
	creationId: string,
	pageAccessToken: string,
): Promise<string> {
	const res = await fetch(
		`https://graph.facebook.com/v19.0/${igUserId}/media_publish?access_token=${pageAccessToken}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ creation_id: creationId }),
		},
	);
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Instagram media publish failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
	const json = (await res.json()) as { id?: string };
	return json.id ?? "";
}

async function createCarousel(
	igUserId: string,
	pageAccessToken: string,
	children: string[],
	caption: string,
): Promise<string> {
	const res = await fetch(
		`https://graph.facebook.com/v19.0/${igUserId}/media?access_token=${pageAccessToken}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				media_type: "CAROUSEL",
				children: children.join(","),
				caption,
			}),
		},
	);
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`Instagram carousel creation failed (${res.status}): ${detail.slice(0, 400)}`,
		);
	}
	const json = (await res.json()) as { id?: string };
	return json.id ?? "";
}

async function uploadImage(
	igUserId: string,
	pageAccessToken: string,
	mediaUrl: string,
	mimeType: string,
	caption: string,
): Promise<string> {
	const isVideo = mimeType.startsWith("video/");
	const creationId = await createMediaItem(
		igUserId,
		pageAccessToken,
		mediaUrl,
		mimeType,
		caption,
		isVideo,
	);

	if (isVideo) {
		let retries = 10;
		while (retries-- > 0) {
			const statusRes = await fetch(
				`https://graph.facebook.com/v19.0/${creationId}?fields=status_code&access_token=${pageAccessToken}`,
			);
			const status = (await statusRes.json()) as { status_code?: string };
			if (status.status_code === "FINISHED") break;
			await new Promise((r) => setTimeout(r, 2000));
		}
	}

	return creationId;
}

export async function publishToInstagram(args: {
	userId: string;
	text: string;
	media?: PostMedia[];
}): Promise<InstagramPostResult> {
	let account = await getFreshToken(args.userId, "instagram");

	let igUser: IgUser;
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
				"No Facebook Page found. Instagram business requires a linked Page.",
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
		igUser = {
			id: igData.instagram_business_account.id,
			username: igData.instagram_business_account.username,
		};
	} catch (err) {
		if (err instanceof PublishError && err.category === "needs_reauth") {
			account = await forceRefresh(args.userId, "instagram");
			throw err;
		}
		throw err;
	}

	const media = args.media ?? [];

	if (media.length === 0) {
		throw new PublishError(
			"invalid_content",
			"Instagram posts require at least one image or video.",
		);
	}

	if (media.length === 1) {
		const creationId = await uploadImage(
			igUser.id,
			pageAccessToken,
			media[0].url,
			media[0].mimeType,
			args.text,
		);
		const postId = await publishMediaItem(
			igUser.id,
			creationId,
			pageAccessToken,
		);
		return {
			remotePostId: postId,
			remoteUrl: `https://www.instagram.com/p/${postId}/`,
		};
	}

	const children: string[] = [];
	for (const m of media.slice(0, 10)) {
		const childId = await uploadImage(
			igUser.id,
			pageAccessToken,
			m.url,
			m.mimeType,
			"",
		);
		children.push(childId);
	}

	const carouselId = await createCarousel(
		igUser.id,
		pageAccessToken,
		children,
		args.text,
	);
	const postId = await publishMediaItem(igUser.id, carouselId, pageAccessToken);
	return {
		remotePostId: postId,
		remoteUrl: `https://www.instagram.com/p/${postId}/`,
	};
}