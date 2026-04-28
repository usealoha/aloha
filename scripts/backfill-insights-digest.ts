// Backfill the weekly Insights digest automation for every existing
// workspace. New workspaces get this automation seeded inside their
// creation paths (`bootstrapDefaultAutomations` in
// `lib/automations/bootstrap.ts`); this script catches every workspace
// that predates that bootstrap.
//
// Idempotent: workspaces that already have a `weekly_insights`
// automation are skipped. Safe to run multiple times.
//
// Usage:
//   bun run scripts/backfill-insights-digest.ts
//
// Optional flags:
//   --dry-run   Print what would be seeded without inserting / scheduling.

import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { automations, workspaces } from "@/db/schema";
import { bootstrapDefaultAutomations } from "@/lib/automations/bootstrap";

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const allWorkspaces = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      ownerUserId: workspaces.ownerUserId,
    })
    .from(workspaces);

  const existingRows = await db
    .select({
      workspaceId: automations.workspaceId,
    })
    .from(automations)
    .where(eq(automations.kind, "weekly_insights"));
  const seeded = new Set(existingRows.map((r) => r.workspaceId));

  let didSeed = 0;
  let skipped = 0;
  const failed: { workspaceId: string; error: string }[] = [];

  for (const ws of allWorkspaces) {
    if (seeded.has(ws.id)) {
      skipped += 1;
      continue;
    }
    if (dryRun) {
      console.log(
        `[dry-run] would seed weekly_insights for ${ws.id} (${ws.name})`,
      );
      didSeed += 1;
      continue;
    }
    try {
      await bootstrapDefaultAutomations({
        workspaceId: ws.id,
        ownerUserId: ws.ownerUserId,
      });
      // Bootstrap helper swallows its own errors and logs to stderr; we
      // sanity-check by re-querying so the count reflects what
      // actually landed.
      const [confirm] = await db
        .select({ id: automations.id })
        .from(automations)
        .where(
          and(
            eq(automations.workspaceId, ws.id),
            eq(automations.kind, "weekly_insights"),
          ),
        )
        .limit(1);
      if (confirm) {
        didSeed += 1;
        console.log(`seeded weekly_insights for ${ws.id} (${ws.name})`);
      } else {
        failed.push({
          workspaceId: ws.id,
          error: "bootstrap returned without inserting",
        });
        console.warn(
          `bootstrap returned without inserting for ${ws.id} (${ws.name})`,
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failed.push({ workspaceId: ws.id, error: message });
      console.error(`failed for ${ws.id} (${ws.name}): ${message}`);
    }
  }

  console.log(
    `\ndone: seeded ${didSeed}, skipped ${skipped}, failed ${failed.length}, total ${allWorkspaces.length}${dryRun ? " (dry run)" : ""}`,
  );
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
