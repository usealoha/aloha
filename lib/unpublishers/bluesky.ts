// Deletes a Bluesky post via the AtpAgent. We store the rkey as
// `remotePostId`, so we need to rebuild the full at:// URI using the
// session's DID (resolved from login).

import { PublishError } from "@/lib/publishers/errors";
import {
	createSession,
	getBlueskyCredentials,
} from "@/lib/publishers/bluesky";

export async function unpublishFromBluesky(args: {
	workspaceId: string;
	remotePostId: string;
}): Promise<void> {
	const credentials = await getBlueskyCredentials(args.workspaceId);
	const agent = await createSession(credentials);

	const did = agent.session?.did ?? credentials.did;
	if (!did) {
		throw new PublishError(
			"needs_reauth",
			"Bluesky session missing DID — cannot resolve post URI.",
		);
	}

	const uri = `at://${did}/app.bsky.feed.post/${args.remotePostId}`;
	try {
		await agent.deletePost(uri);
	} catch (err) {
		// AtpAgent wraps HTTP errors — we don't have a clean status code to
		// inspect, so default to transient and let the dispatcher record the
		// message. "Record not found" style errors just mean the post is
		// already gone; we swallow those by matching the message.
		const message = err instanceof Error ? err.message : String(err);
		if (/not found|does not exist/i.test(message)) return;
		throw new PublishError(
			"transient",
			`Bluesky delete failed: ${message.slice(0, 400)}`,
		);
	}
}
