// One-shot: copies `users.polarCustomerId` onto the user's owned workspace
// so billing can resolve to workspaceId from here on. Idempotent —
// already-populated workspace rows are left alone.
//
// Run once as part of Slice 2.7:
//   bun run scripts/backfill-polar-customer.ts

import "dotenv/config";
import { and, eq, isNull, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { users, workspaces } from "@/db/schema";

async function main() {
  const targets = await db
    .select({
      userId: users.id,
      polarCustomerId: users.polarCustomerId,
    })
    .from(users)
    .innerJoin(workspaces, eq(workspaces.ownerUserId, users.id))
    .where(
      and(
        isNotNull(users.polarCustomerId),
        isNull(workspaces.polarCustomerId),
      ),
    );

  console.log(`Copying polarCustomerId onto ${targets.length} workspace(s).`);
  let updated = 0;
  for (const t of targets) {
    if (!t.polarCustomerId) continue;
    await db
      .update(workspaces)
      .set({ polarCustomerId: t.polarCustomerId, updatedAt: new Date() })
      .where(eq(workspaces.ownerUserId, t.userId));
    updated += 1;
  }
  console.log(`Done. Workspaces updated: ${updated}.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
