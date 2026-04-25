import { eq } from "drizzle-orm";
import type { PostMedia } from "@/db/schema";
import { AtpAgent, type BlobRef } from "@atproto/api";
import { db } from "@/db";
import { blueskyCredentials } from "@/db/schema";
import { PublishError } from "./errors";

export type BlueskyPostResult = {
	remotePostId: string;
	remoteUrl: string;
};

type BlueskyCredentials = {
	handle: string;
	appPassword: string;
	did?: string | null;
};

export async function getBlueskyCredentials(workspaceId: string): Promise<BlueskyCredentials> {
	const [row] = await db
		.select({
			handle: blueskyCredentials.handle,
			appPassword: blueskyCredentials.appPassword,
			did: blueskyCredentials.did,
		})
		.from(blueskyCredentials)
		.where(eq(blueskyCredentials.workspaceId, workspaceId))
		.limit(1);

	if (!row) {
		throw new PublishError(
			"needs_reauth",
			"Bluesky account not connected. Please connect your Bluesky account.",
		);
	}

	return {
		handle: row.handle,
		appPassword: row.appPassword,
		did: row.did,
	};
}

export async function createSession(credentials: BlueskyCredentials) {
	const agent = new AtpAgent({ service: "https://bsky.social" });
	await agent.login({
		identifier: credentials.handle,
		password: credentials.appPassword,
	});
	return agent;
}

async function uploadImage(
	agent: AtpAgent,
	media: PostMedia,
): Promise<{ blob: BlobRef; alt: string }> {
	const bin = await fetch(media.url);
	if (!bin.ok) {
		throw new PublishError(
			"transient",
			`Could not fetch media (${bin.status}) from ${media.url}`,
		);
	}
	const bytes = await bin.arrayBuffer();
	const uploaded = await agent.uploadBlob(new Uint8Array(bytes), {
		encoding: media.mimeType,
	});
	return {
		blob: uploaded.data.blob,
		alt: media.alt ?? "",
	};
}

async function createPost(
	agent: AtpAgent,
	text: string,
	images: Array<{ blob: BlobRef; alt: string }>,
	reply?: {
		root: { uri: string; cid: string };
		parent: { uri: string; cid: string };
	},
): Promise<{ uri: string; cid: string }> {
	const embed = images.length > 0
		? {
			$type: "app.bsky.embed.images",
			images: images.map((img) => ({
				alt: img.alt,
				image: img.blob,
			})),
		}
		: undefined;

	const result = await agent.post({
		text,
		embed,
		...(reply ? { reply } : {}),
	});

	return {
		uri: result.uri,
		cid: result.cid,
	};
}

export async function publishToBluesky(args: {
	workspaceId: string;
	text: string;
	media?: PostMedia[];
}): Promise<BlueskyPostResult> {
	const credentials = await getBlueskyCredentials(args.workspaceId);
	const agent = await createSession(credentials);

	const uploadedImages = [];
	if (args.media && args.media.length > 0) {
		for (const m of args.media) {
			const img = await uploadImage(agent, m);
			uploadedImages.push(img);
		}
	}

	const { uri } = await createPost(agent, args.text, uploadedImages);

	const rkey = uri.split("/").pop() ?? uri;

	// Store the full AT-URI so we can pass it directly to getPostThread
	// when fetching per-post comments. The rkey is kept in the web URL
	// since bsky.app only understands that short form.
	return {
		remotePostId: uri,
		remoteUrl: `https://bsky.app/profile/${credentials.handle}/post/${rkey}`,
	};
}

// Post a connected thread on Bluesky. Each part replies to the previous,
// with `root` pointing at the thread head per AT Protocol conventions.
// On mid-thread failure, delete everything posted so far.
export async function publishBlueskyThread(args: {
	workspaceId: string;
	parts: { text: string; media?: PostMedia[] }[];
}): Promise<BlueskyPostResult> {
	if (args.parts.length === 0) {
		throw new PublishError("invalid_content", "Thread has no parts");
	}
	const credentials = await getBlueskyCredentials(args.workspaceId);
	const agent = await createSession(credentials);

	const posted: { uri: string }[] = [];
	let root: { uri: string; cid: string } | undefined;
	let parent: { uri: string; cid: string } | undefined;
	let headUri: string | undefined;

	for (let i = 0; i < args.parts.length; i++) {
		const part = args.parts[i];
		try {
			const images: Array<{ blob: BlobRef; alt: string }> = [];
			for (const m of part.media ?? []) {
				images.push(await uploadImage(agent, m));
			}
			const replyRef = root && parent ? { root, parent } : undefined;
			const { uri, cid } = await createPost(agent, part.text, images, replyRef);
			posted.push({ uri });
			if (!root) {
				root = { uri, cid };
				headUri = uri;
			}
			parent = { uri, cid };
		} catch (err) {
			// Compensate: delete anything we already posted (latest-first).
			for (const p of posted.slice().reverse()) {
				try {
					await agent.deletePost(p.uri);
				} catch {
					// swallow — compensation is opportunistic
				}
			}
			throw err;
		}
	}

	const rkey = headUri!.split("/").pop() ?? headUri!;
	return {
		remotePostId: headUri!,
		remoteUrl: `https://bsky.app/profile/${credentials.handle}/post/${rkey}`,
	};
}
