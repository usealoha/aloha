// Populates the new `workspaceId` columns on tenant-scoped tables from
// each row's `userId` via `users.activeWorkspaceId`. Idempotent — only
// touches rows where `workspaceId` is still NULL. Run AFTER
// `backfill-workspaces.ts` so every user has an active workspace.
//
// Usage:
//   bun run scripts/backfill-workspace-ids.ts

import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "@/db";

const TABLES = [
  "accounts",
  "ai_jobs",
  "assets",
  "automations",
  "bluesky_credentials",
  "brand_corpus",
  "brand_voice",
  "brand_voice_channels",
  "broadcasts",
  "campaigns",
  "channel_notifications",
  "channel_profiles",
  "channel_states",
  "feature_access",
  "feeds",
  "generations",
  "ideas",
  "inbox_messages",
  "inbox_sync_cursors",
  "mastodon_credentials",
  "muse_enabled_channels",
  "notifications",
  "notion_credentials",
  "pages",
  "platform_content_cache",
  "platform_insights",
  "post_comments",
  "posts",
  "sending_domains",
  "subscribers",
  "subscriptions",
  "telegram_credentials",
];

async function main() {
  for (const table of TABLES) {
    const tableIdent = sql.identifier(table);
    try {
      await db.execute(sql`
        UPDATE ${tableIdent} t
        SET "workspaceId" = u."activeWorkspaceId"
        FROM users u
        WHERE t."userId" = u.id
          AND t."workspaceId" IS NULL
          AND u."activeWorkspaceId" IS NOT NULL
      `);
      console.log(`  ${table}: ok`);
    } catch (err) {
      // Column might not exist yet on a partially-migrated DB (e.g.,
      // subscriptions.workspaceId only appears at migration 0017, while
      // other tables got the column at 0015). Skip gracefully — re-run
      // after the next migration applies.
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("does not exist") || msg.includes("undefined column")) {
        console.log(`  ${table}: skipped (column not ready yet)`);
      } else {
        throw err;
      }
    }
  }
  console.log("\nDone.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
