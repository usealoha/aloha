import {
  getBlueskyCredentials,
  createSession,
} from "@/lib/publishers/bluesky";
import type { SyncResult, NormalizedMessage } from "./types";

const MAX_PAGES = 2;
const PAGE_SIZE = 50;

// Inbox sync only cares about mentions. Replies land on the post detail
// page and are fetched there via lib/posts/comments/bluesky.ts.
export async function fetchBlueskyNotifications(
  workspaceId: string,
  cursor: string | null,
): Promise<SyncResult> {
  const credentials = await getBlueskyCredentials(workspaceId);
  const agent = await createSession(credentials);

  const messages: NormalizedMessage[] = [];
  let currentCursor = cursor ?? undefined;
  let pagesRead = 0;

  while (pagesRead < MAX_PAGES) {
    const res = await agent.listNotifications({
      limit: PAGE_SIZE,
      cursor: currentCursor,
      reasons: ["mention"],
    });

    for (const n of res.data.notifications) {
      if (n.reason !== "mention") continue;

      const record = n.record as Record<string, unknown>;
      const reply = record.reply as
        | { root?: { uri?: string }; parent?: { uri?: string } }
        | undefined;

      messages.push({
        remoteId: n.uri,
        threadId: reply?.root?.uri ?? null,
        parentId: reply?.parent?.uri ?? null,
        reason: "mention",
        direction: null,
        authorDid: n.author.did,
        authorHandle: n.author.handle,
        authorDisplayName: n.author.displayName ?? null,
        authorAvatarUrl: n.author.avatar ?? null,
        content: (record.text as string) ?? "",
        platformData: {
          uri: n.uri,
          cid: n.cid,
          record: n.record,
          author: n.author,
          isRead: n.isRead,
        },
        platformCreatedAt: new Date(n.indexedAt),
      });
    }

    currentCursor = res.data.cursor;
    pagesRead++;

    if (!res.data.cursor || res.data.notifications.length < PAGE_SIZE) break;
  }

  return {
    messages,
    comments: [],
    newCursor: currentCursor ?? null,
  };
}
