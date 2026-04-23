"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { requireContext } from "@/lib/current-context";
import { assertRole, ROLES } from "@/lib/workspaces/roles";
import {
  accounts,
  blueskyCredentials,
  inboxMessages,
  mastodonCredentials,
  telegramCredentials,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { syncInbox } from "@/lib/inbox/sync";
import {
  replyOnBluesky,
  replyOnMastodon,
  replyOnTelegram,
  replyOnX,
} from "@/lib/inbox/reply";
import {
  sendBlueskyDm,
  sendInstagramDm,
  sendXDm,
} from "@/lib/inbox/reply-dm";

export async function refreshInbox() {
  const ctx = await assertRole(ROLES.EDITOR);
  const userId = ctx.user.id;
  const workspaceId = ctx.workspace.id;

  // Detect which platforms are connected by hitting every credential table
  // in parallel. Each syncInbox call handles its own fetcher errors
  // internally, so one platform failing doesn't short-circuit the others.
  const [bsky, twitter, mastodon, telegram, instagram, facebook] =
    await Promise.all([
      db
        .select({ id: blueskyCredentials.id })
        .from(blueskyCredentials)
        .where(eq(blueskyCredentials.workspaceId, workspaceId))
        .limit(1),
      db
        .select({ provider: accounts.provider })
        .from(accounts)
        .where(and(eq(accounts.workspaceId, workspaceId), eq(accounts.provider, "twitter")))
        .limit(1),
      db
        .select({ id: mastodonCredentials.id })
        .from(mastodonCredentials)
        .where(eq(mastodonCredentials.workspaceId, workspaceId))
        .limit(1),
      db
        .select({ id: telegramCredentials.id })
        .from(telegramCredentials)
        .where(eq(telegramCredentials.workspaceId, workspaceId))
        .limit(1),
      db
        .select({ provider: accounts.provider })
        .from(accounts)
        .where(and(eq(accounts.workspaceId, workspaceId), eq(accounts.provider, "instagram")))
        .limit(1),
      db
        .select({ provider: accounts.provider })
        .from(accounts)
        .where(and(eq(accounts.workspaceId, workspaceId), eq(accounts.provider, "facebook")))
        .limit(1),
    ]);

  const platforms: Array<Parameters<typeof syncInbox>[1]> = [];
  if (bsky.length > 0) platforms.push("bluesky");
  if (twitter.length > 0) platforms.push("twitter");
  if (mastodon.length > 0) platforms.push("mastodon");
  if (telegram.length > 0) platforms.push("telegram");
  if (instagram.length > 0) platforms.push("instagram");
  if (facebook.length > 0) platforms.push("facebook");

  const results = await Promise.allSettled(
    platforms.map((p) => syncInbox(userId, p)),
  );

  let mentions = 0;
  let dms = 0;
  for (const r of results) {
    if (r.status === "fulfilled") {
      mentions += r.value.mentionsSynced;
      dms += r.value.dmsSynced;
    }
  }

  revalidatePath("/app/inbox");
  return { synced: mentions + dms, mentions, dms };
}

export async function markAsRead(messageId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const ctx = await assertRole(ROLES.EDITOR);

  await db
    .update(inboxMessages)
    .set({ isRead: true, updatedAt: new Date() })
    .where(
      and(
        eq(inboxMessages.id, messageId),
        eq(inboxMessages.workspaceId, ctx.workspace.id),
      ),
    );

  revalidatePath("/app/inbox");
}

// Mark every message in a DM conversation as read. Invoked when the user
// opens a DM thread — DMs treat read-state at the conversation level,
// unlike mentions which stay per-message.
export async function markConvoAsRead(threadId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const ctx = await assertRole(ROLES.EDITOR);

  await db
    .update(inboxMessages)
    .set({ isRead: true, updatedAt: new Date() })
    .where(
      and(
        eq(inboxMessages.workspaceId, ctx.workspace.id),
        eq(inboxMessages.threadId, threadId),
        eq(inboxMessages.reason, "dm"),
        eq(inboxMessages.isRead, false),
      ),
    );
}

export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const ctx = await assertRole(ROLES.EDITOR);

  await db
    .update(inboxMessages)
    .set({ isRead: true, updatedAt: new Date() })
    .where(
      and(
        eq(inboxMessages.workspaceId, ctx.workspace.id),
        eq(inboxMessages.isRead, false),
      ),
    );

  revalidatePath("/app/inbox");
}

export async function sendReply(messageId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const ctx = await assertRole(ROLES.EDITOR);

  const [message] = await db
    .select()
    .from(inboxMessages)
    .where(
      and(
        eq(inboxMessages.id, messageId),
        eq(inboxMessages.workspaceId, ctx.workspace.id),
      ),
    )
    .limit(1);

  if (!message) throw new Error("Message not found");

  // DMs send into a conversation (threadId). Mentions reply to the
  // specific remote post/status. Telegram is DM-native — regardless of
  // how it's classified, its reply endpoint takes (chatId, messageId) so
  // we keep the existing replyOnTelegram call.
  if (message.reason === "dm" && message.platform !== "telegram") {
    const convoId = message.threadId;
    if (!convoId) throw new Error("Missing conversation id for DM reply");

    if (message.platform === "bluesky") {
      await sendBlueskyDm(session.user.id, convoId, content);
    } else if (message.platform === "twitter") {
      await sendXDm(session.user.id, convoId, content);
    } else if (message.platform === "instagram") {
      await sendInstagramDm(session.user.id, convoId, content);
    } else if (message.platform === "facebook") {
      throw new Error("FACEBOOK_DM_REPLY_COMING_SOON");
    }
  } else if (message.platform === "bluesky") {
    const platformData = message.platformData as Record<string, unknown>;
    const parentCid = platformData.cid as string;
    if (!parentCid) throw new Error("Missing CID for reply");
    const rootUri = message.threadId ?? message.remoteId;

    await replyOnBluesky(
      session.user.id,
      message.remoteId,
      parentCid,
      rootUri,
      content,
    );
  } else if (message.platform === "twitter") {
    await replyOnX(session.user.id, message.remoteId, content);
  } else if (message.platform === "mastodon") {
    await replyOnMastodon(session.user.id, message.remoteId, content);
  } else if (message.platform === "telegram") {
    const platformData = message.platformData as Record<string, unknown>;
    const chatId = platformData.chatId as string;
    const threadId = message.threadId;
    if (!chatId && !threadId) throw new Error("Missing chat ID for reply");
    await replyOnTelegram(session.user.id, chatId || threadId || "", message.remoteId, content);
  }

  revalidatePath("/app/inbox");
  return { success: true };
}
