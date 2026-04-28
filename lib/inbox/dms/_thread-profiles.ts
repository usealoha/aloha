import { sql } from "drizzle-orm";
import { db } from "@/db";
import { dmThreadProfiles } from "@/db/schema";

export type ThreadProfile = {
  threadId: string;
  counterpartyId: string;
  counterpartyHandle: string;
  counterpartyDisplayName: string | null;
  counterpartyAvatarUrl: string | null;
};

// Upserts cached counterparty info for DM threads. The inbox UI prefers
// these rows over message-derived author identity so outbound-only threads
// (and platforms whose API doesn't expand recipients) still render
// correctly. Best-effort — callers should not surface failures, since the
// messages themselves are already persisted.
export async function upsertThreadProfiles(
  workspaceId: string,
  platform: string,
  profiles: ThreadProfile[],
): Promise<void> {
  if (profiles.length === 0) return;
  const rows = profiles.map((p) => ({
    workspaceId,
    platform,
    threadId: p.threadId,
    counterpartyId: p.counterpartyId,
    counterpartyHandle: p.counterpartyHandle,
    counterpartyDisplayName: p.counterpartyDisplayName,
    counterpartyAvatarUrl: p.counterpartyAvatarUrl,
    updatedAt: new Date(),
  }));
  await db
    .insert(dmThreadProfiles)
    .values(rows)
    .onConflictDoUpdate({
      target: [
        dmThreadProfiles.workspaceId,
        dmThreadProfiles.platform,
        dmThreadProfiles.threadId,
      ],
      set: {
        counterpartyId: sql`excluded."counterpartyId"`,
        counterpartyHandle: sql`excluded."counterpartyHandle"`,
        counterpartyDisplayName: sql`excluded."counterpartyDisplayName"`,
        counterpartyAvatarUrl: sql`excluded."counterpartyAvatarUrl"`,
        updatedAt: new Date(),
      },
    });
}
