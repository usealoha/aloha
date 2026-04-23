// Uploads videos to YouTube via the Data API v3.
// Supports: video uploads (Shorts when ≤60s and vertical — appending
// #Shorts in the description nudges YouTube to classify it as such).
// Community posts are intentionally not supported — there's no public
// write endpoint for them in the YouTube Data API.

import type { PostMedia } from "@/db/schema";
import { categorizeHttpStatus, PublishError } from "./errors";
import { forceRefresh, getFreshToken, type ProviderAccount } from "./tokens";

export type YouTubePostResult = {
	remotePostId: string;
	remoteUrl: string;
};

const VIDEO_MAX_BYTES = 256 * 1024 * 1024; // 256 MB — Shorts ceiling

type VideoResource = {
	id: string;
};

function deriveTitle(text: string): string {
	const firstLine = text.split("\n").find((l) => l.trim().length > 0) ?? "";
	const trimmed = firstLine.trim().slice(0, 100);
	return trimmed || "Untitled";
}

function buildDescription(text: string): string {
	// YouTube description cap is 5000 chars. Append #Shorts so vertical
	// ≤60s clips get classified as Shorts by YouTube's pipeline.
	const base = text.slice(0, 4990);
	return /#shorts/i.test(base) ? base : `${base}\n\n#Shorts`;
}

async function startResumableUpload(
	account: ProviderAccount,
	media: PostMedia,
	contentLength: number,
	title: string,
	description: string,
): Promise<string> {
	const metadata = {
		snippet: {
			title,
			description,
		},
		status: {
			privacyStatus: "public",
			selfDeclaredMadeForKids: false,
		},
	};

	const res = await fetch(
		"https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${account.accessToken}`,
				"Content-Type": "application/json; charset=UTF-8",
				"X-Upload-Content-Type": media.mimeType,
				"X-Upload-Content-Length": String(contentLength),
			},
			body: JSON.stringify(metadata),
		},
	);

	if (!res.ok) {
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`YouTube resumable init failed (${res.status}): ${await res.text().catch(() => "")}`,
		);
	}

	const uploadUrl = res.headers.get("location");
	if (!uploadUrl) {
		throw new PublishError(
			"transient",
			"YouTube resumable init returned no Location header",
		);
	}
	return uploadUrl;
}

async function uploadVideoBytes(
	uploadUrl: string,
	bytes: ArrayBuffer,
	mimeType: string,
): Promise<VideoResource> {
	const res = await fetch(uploadUrl, {
		method: "PUT",
		headers: {
			"Content-Type": mimeType,
			"Content-Length": String(bytes.byteLength),
		},
		body: bytes,
	});

	if (!res.ok) {
		throw new PublishError(
			categorizeHttpStatus(res.status),
			`YouTube video upload failed (${res.status}): ${await res.text().catch(() => "")}`,
		);
	}

	const data = (await res.json()) as VideoResource;
	if (!data.id) {
		throw new PublishError(
			"transient",
			"YouTube upload returned no video id",
		);
	}
	return data;
}

async function fetchMediaBytes(media: PostMedia): Promise<ArrayBuffer> {
	const bin = await fetch(media.url);
	if (!bin.ok) {
		throw new PublishError(
			"transient",
			`Could not fetch media (${bin.status}) from ${media.url}`,
		);
	}
	const bytes = await bin.arrayBuffer();
	if (bytes.byteLength > VIDEO_MAX_BYTES) {
		throw new PublishError(
			"invalid_content",
			`Video exceeds YouTube's 256 MB ceiling (got ${bytes.byteLength} bytes)`,
		);
	}
	return bytes;
}

async function uploadVideo(
	account: ProviderAccount,
	media: PostMedia,
	title: string,
	description: string,
): Promise<VideoResource> {
	const bytes = await fetchMediaBytes(media);
	const uploadUrl = await startResumableUpload(
		account,
		media,
		bytes.byteLength,
		title,
		description,
	);
	return uploadVideoBytes(uploadUrl, bytes, media.mimeType);
}

export async function publishToYouTube(args: {
	workspaceId: string;
	text: string;
	media?: PostMedia[];
}): Promise<YouTubePostResult> {
	const video = args.media?.find((m) => m.mimeType.startsWith("video/"));
	if (!video) {
		throw new PublishError(
			"invalid_content",
			"YouTube requires a video attachment",
		);
	}

	const title = deriveTitle(args.text);
	const description = buildDescription(args.text);

	let account = await getFreshToken(args.workspaceId, "youtube");

	let result: VideoResource;
	try {
		result = await uploadVideo(account, video, title, description);
	} catch (err) {
		if (err instanceof PublishError && err.category === "needs_reauth") {
			account = await forceRefresh(args.workspaceId, "youtube");
			result = await uploadVideo(account, video, title, description);
		} else {
			throw err;
		}
	}

	return {
		remotePostId: result.id,
		remoteUrl: `https://www.youtube.com/shorts/${result.id}`,
	};
}
