import bigInt from "big-integer";
import type { SyncResult, NormalizedMessage } from "./types";
import { getTelegramSession } from "@/lib/publishers/telegram";
import {
	upsertThreadProfiles,
	type ThreadProfile,
} from "./dms/_thread-profiles";

const MAX_MESSAGES = 100;

// Telegram is a DM surface. Every message emits reason='dm' with a
// direction derived from msg.out (outgoing vs incoming). Both directions
// are kept so the thread view shows the full back-and-forth.
export async function fetchTelegramMessages(
	workspaceId: string,
	cursor: string | null,
): Promise<SyncResult> {
	const session = await getTelegramSession(workspaceId);
	if (!session) {
		return { messages: [], comments: [], newCursor: null };
	}

	const { client, chatId } = session;

	try {
		// Resolve the chat entity
		let entity;
		if (chatId.startsWith("@")) {
			entity = await client.getEntity(chatId);
		} else {
			entity = await client.getEntity(bigInt(chatId));
		}

		// Get messages from the chat
		const messages: NormalizedMessage[] = [];
		const offsetId = cursor ? parseInt(cursor, 10) : 0;

		const history = await client.getMessages(entity, {
			limit: MAX_MESSAGES,
			offsetId: offsetId || undefined,
		});

		let maxId = offsetId;

		for (const msg of history) {
			if (!msg.message) continue; // Skip non-text messages (service, etc.)

			if (msg.id > maxId) {
				maxId = msg.id;
			}

			const sender = await msg.getSender();
			const outbound = Boolean(msg.out);

			const senderId = sender ? String(sender.id) : "self";
			const senderName = sender
				? (sender as { firstName?: string; lastName?: string; username?: string }).firstName ||
				  (sender as { username?: string }).username ||
				  "Unknown"
				: "You";

			messages.push({
				remoteId: String(msg.id),
				threadId: String(entity.id),
				parentId: msg.replyTo ? String(msg.replyTo.replyToMsgId) : null,
				reason: "dm",
				direction: outbound ? "out" : "in",
				authorDid: senderId,
				authorHandle: (sender as { username?: string }).username || senderId,
				authorDisplayName: senderName,
				authorAvatarUrl: null,
				content: msg.message,
				platformData: {
					chatId: String(entity.id),
					date: msg.date,
					hasMedia: msg.media !== undefined && msg.media !== null,
				},
				platformCreatedAt: new Date(msg.date * 1000),
			});
		}

		// Return the next offset (max message ID)
		const newCursor = maxId > offsetId ? String(maxId) : null;

		// One thread per Telegram session — the bound channel/group itself
		// is the "counterparty." Cache its identity so the inbox header
		// shows the chat title rather than the latest sender.
		const e = entity as {
			id: { toString(): string } | string | number;
			title?: string;
			username?: string;
			firstName?: string;
			lastName?: string;
		};
		const entityId = String(e.id);
		const handle = e.username ?? entityId;
		const displayName =
			e.title ??
			[e.firstName, e.lastName].filter(Boolean).join(" ") ??
			null;
		await upsertThreadProfiles(workspaceId, "telegram", [
			{
				threadId: entityId,
				counterpartyId: entityId,
				counterpartyHandle: handle,
				counterpartyDisplayName: displayName || null,
				counterpartyAvatarUrl: null,
			},
		]);

		return {
			messages,
			comments: [],
			newCursor,
		};
	} catch (err) {
		console.error("[telegram] fetch messages failed", err);
		return { messages: [], comments: [], newCursor: cursor };
	}
}
