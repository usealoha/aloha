// Instagram's Graph API does not expose an endpoint to delete published
// media (comments can be deleted, posts cannot — as of the Graph API v19
// spec). Calling the generic `DELETE /{media-id}` returns 400 with
// `Unsupported delete request`.
//
// We keep this adapter so the dispatcher has a canonical "Instagram
// unsupported" path — throwing a specific error lets the UI render a
// "Delete from the Instagram app yourself" hint instead of a generic
// failure.

import { PublishError } from "@/lib/publishers/errors";

export async function unpublishFromInstagram(_args: {
	userId: string;
	remotePostId: string;
}): Promise<void> {
	throw new PublishError(
		"unsupported_platform",
		"Instagram's API doesn't allow deleting posts. Delete it from the Instagram app and we'll update the record here.",
	);
}
