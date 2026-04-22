import { getFreshToken, forceRefresh } from "@/lib/publishers/tokens";
import type { NormalizedMessage, SyncResult } from "../types";

const PAGE_SIZE = 100;
const MAX_PAGES = 2;

type DmUser = {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
};

type DmEvent = {
  id: string;
  event_type: string;
  text?: string;
  created_at?: string;
  dm_conversation_id?: string;
  sender_id?: string;
};

type DmEventsResponse = {
  data?: DmEvent[];
  includes?: { users?: DmUser[] };
  meta?: { next_token?: string; result_count?: number };
};

async function fetchPage(
  accessToken: string,
  paginationToken?: string,
): Promise<DmEventsResponse> {
  const params = new URLSearchParams({
    max_results: String(PAGE_SIZE),
    event_types: "MessageCreate",
    "dm_event.fields": "id,event_type,text,created_at,dm_conversation_id,sender_id",
    expansions: "sender_id",
    "user.fields": "name,username,profile_image_url",
  });
  if (paginationToken) params.set("pagination_token", paginationToken);

  const res = await fetch(
    `https://api.x.com/2/dm_events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`X dm_events ${res.status}: ${detail.slice(0, 300)}`);
  }

  return res.json() as Promise<DmEventsResponse>;
}

export async function fetchXDms(
  userId: string,
  cursor: string | null,
): Promise<SyncResult> {
  let account = await getFreshToken(userId, "twitter");

  const messages: NormalizedMessage[] = [];
  let token = cursor ?? undefined;
  let pagesRead = 0;

  while (pagesRead < MAX_PAGES) {
    let res: DmEventsResponse;
    try {
      res = await fetchPage(account.accessToken, token);
    } catch (err) {
      if (pagesRead === 0 && String(err).includes("401")) {
        account = await forceRefresh(userId, "twitter");
        res = await fetchPage(account.accessToken, token);
      } else {
        throw err;
      }
    }

    if (!res.data || res.data.length === 0) break;

    const usersById = new Map<string, DmUser>();
    for (const u of res.includes?.users ?? []) usersById.set(u.id, u);

    for (const ev of res.data) {
      if (ev.event_type !== "MessageCreate") continue;
      if (!ev.sender_id || !ev.dm_conversation_id) continue;

      const outbound = ev.sender_id === account.providerAccountId;
      const user = usersById.get(ev.sender_id);

      messages.push({
        remoteId: ev.id,
        threadId: ev.dm_conversation_id,
        parentId: null,
        reason: "dm",
        direction: outbound ? "out" : "in",
        authorDid: ev.sender_id,
        authorHandle: user?.username ?? ev.sender_id,
        authorDisplayName: user?.name ?? null,
        authorAvatarUrl: user?.profile_image_url ?? null,
        content: ev.text ?? "",
        platformData: {
          convoId: ev.dm_conversation_id,
          senderId: ev.sender_id,
        },
        platformCreatedAt: ev.created_at ? new Date(ev.created_at) : new Date(),
      });
    }

    token = res.meta?.next_token;
    pagesRead++;

    if (!token || (res.meta?.result_count ?? 0) < PAGE_SIZE) break;
  }

  return { messages, comments: [], newCursor: token ?? null };
}
