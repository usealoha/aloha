import {
  createSession,
  getBlueskyCredentials,
} from "@/lib/publishers/bluesky";
import { forceRefresh, getFreshToken } from "@/lib/publishers/tokens";

// DMs send into a conversation, not to a specific message — so every
// helper here takes the convoId (stored in inboxMessages.threadId) plus
// the content. The caller's responsibility is to pull convoId from the
// message row before invoking.

export async function sendBlueskyDm(
  workspaceId: string,
  convoId: string,
  content: string,
): Promise<void> {
  const credentials = await getBlueskyCredentials(workspaceId);
  const agent = await createSession(credentials);
  const chatAgent = agent.withProxy("bsky_chat", "did:web:api.bsky.chat");

  await (
    chatAgent as unknown as {
      chat: {
        bsky: {
          convo: {
            sendMessage: (args: {
              convoId: string;
              message: { text: string };
            }) => Promise<unknown>;
          };
        };
      };
    }
  ).chat.bsky.convo.sendMessage({
    convoId,
    message: { text: content },
  });
}

export async function sendXDm(
  workspaceId: string,
  convoId: string,
  content: string,
): Promise<void> {
  let account = await getFreshToken(workspaceId, "twitter");

  const body = JSON.stringify({ text: content });
  const url = `https://api.x.com/2/dm_conversations/${convoId}/messages`;

  let res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
      "Content-Type": "application/json",
    },
    body,
  });

  if (res.status === 401) {
    account = await forceRefresh(workspaceId, "twitter");
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        "Content-Type": "application/json",
      },
      body,
    });
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`X DM send ${res.status}: ${detail.slice(0, 300)}`);
  }
}

export async function sendInstagramDm(
  workspaceId: string,
  convoId: string,
  content: string,
): Promise<void> {
  let account = await getFreshToken(workspaceId, "instagram");

  // Resolve the page + IG account id so we know whose outbox we're
  // sending from. Same two-hop as the DM fetcher.
  const pagesRes = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${account.accessToken}`,
  );
  if (!pagesRes.ok) {
    if (pagesRes.status === 401) {
      account = await forceRefresh(workspaceId, "instagram");
    } else {
      throw new Error(`Instagram pages lookup ${pagesRes.status}`);
    }
  }
  const pages = (await pagesRes.json()) as {
    data?: Array<{ id: string; access_token: string }>;
  };
  const page = pages.data?.[0];
  if (!page) throw new Error("No Facebook page linked to Instagram");

  // The recipient id is stored on the convo via the /conversations
  // participants field. We need it to POST a message. Look it up.
  const convoRes = await fetch(
    `https://graph.facebook.com/v19.0/${convoId}?fields=participants&access_token=${page.access_token}`,
  );
  if (!convoRes.ok) {
    const detail = await convoRes.text().catch(() => "");
    throw new Error(
      `Instagram convo lookup ${convoRes.status}: ${detail.slice(0, 300)}`,
    );
  }
  const convo = (await convoRes.json()) as {
    participants?: { data?: Array<{ id: string }> };
  };
  const participants = convo.participants?.data ?? [];

  const igRes = await fetch(
    `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
  );
  const igData = (await igRes.json()) as {
    instagram_business_account?: { id: string };
  };
  const selfId = igData.instagram_business_account?.id;
  const recipient = participants.find((p) => p.id !== selfId);
  if (!recipient) throw new Error("No recipient found in Instagram conversation");

  const sendRes = await fetch(
    `https://graph.facebook.com/v19.0/${page.id}/messages?access_token=${page.access_token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "instagram",
        recipient: { id: recipient.id },
        message: { text: content },
      }),
    },
  );

  if (!sendRes.ok) {
    const detail = await sendRes.text().catch(() => "");
    throw new Error(`Instagram DM send ${sendRes.status}: ${detail.slice(0, 300)}`);
  }
}
