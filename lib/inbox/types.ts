// Mentions + DMs land here. Replies to the user's own posts live in
// post_comments (see lib/posts/comments/*).
export type NormalizedMessage = {
  remoteId: string;
  // For DMs, threadId is the conversation id so thread views can group
  // messages across the back-and-forth.
  threadId: string | null;
  parentId: string | null;
  reason: "mention" | "dm";
  // null for mentions (always inbound). 'in' or 'out' for DMs.
  direction: "in" | "out" | null;
  authorDid: string;
  authorHandle: string;
  authorDisplayName: string | null;
  authorAvatarUrl: string | null;
  content: string;
  attachments?: Attachment[];
  platformData: Record<string, unknown>;
  platformCreatedAt: Date;
};

export type Attachment = {
  type: "image" | "video" | "gif" | "audio" | "file";
  url: string;
  previewUrl?: string;
  width?: number;
  height?: number;
  altText?: string;
  durationSec?: number;
  fileName?: string;
};

export type SyncResult = {
  messages: NormalizedMessage[];
  comments: never[];
  newCursor: string | null;
};
