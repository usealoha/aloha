// Production Phase-2 migration runbook (TS version).
//
// Applies migrations + backfills in the order required by data
// dependencies. See scripts/prod-phase2-migrate.sh for the bash version.
//
// Usage:
//   bun run scripts/prod-phase2-migrate.ts
//
// Fails fast on any SQL error. Safe to re-run after a fix as long as you
// comment out already-applied steps (or restore from backup).

import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { prepare: false, max: 1 });

const DRIZZLE_DIR = join(process.cwd(), "drizzle");

async function applySqlFile(tag: string) {
  const path = join(DRIZZLE_DIR, `${tag}.sql`);
  const body = readFileSync(path, "utf8");
  // Drizzle writes `--> statement-breakpoint` between statements.
  const statements = body
    .split(/-->\s*statement-breakpoint/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    await sql.unsafe(stmt);
  }
}

function runTsScript(relPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("bun", ["run", relPath], {
      stdio: "inherit",
      env: process.env,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${relPath} exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

async function step(label: string, fn: () => Promise<void>) {
  console.log(`\n=== ${label} ===`);
  await fn();
}

async function seedJournal() {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    );
  `);
  const rows: Array<[string, number]> = [
    ["0012_bent_shinobi_shaw", 1776923636943],
    ["0013_amusing_spitfire", 1776923927995],
    ["0014_natural_mach_iv", 1776925399394],
    ["0015_old_monster_badoon", 1776927814252],
    ["0016_cheerful_dazzler", 1776935209981],
    ["0017_fantastic_firedrake", 1776935741468],
    ["0018_modern_the_leader", 1776937437758],
    ["0019_wonderful_nightcrawler", 1776939154501],
  ];
  for (const [hash, ts] of rows) {
    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      SELECT ${hash}, ${ts}
      WHERE NOT EXISTS (
        SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = ${hash}
      )
    `;
  }
}

async function main() {
  await step("0012 — posts status enum + audit fields", () =>
    applySqlFile("0012_bent_shinobi_shaw"),
  );
  await step("0013 — post_notes table", () =>
    applySqlFile("0013_amusing_spitfire"),
  );
  await step("0014 — workspaces + workspace_members", () =>
    applySqlFile("0014_natural_mach_iv"),
  );
  await step("backfill-workspaces.ts", () =>
    runTsScript("scripts/backfill-workspaces.ts"),
  );
  await step("0015 — workspaceId on 31 tenant tables", () =>
    applySqlFile("0015_old_monster_badoon"),
  );
  await step("0017 — subscriptions.workspaceId (before NOT NULL pass)", () =>
    applySqlFile("0017_fantastic_firedrake"),
  );
  await step("backfill-workspace-ids.ts", () =>
    runTsScript("scripts/backfill-workspace-ids.ts"),
  );
  await step("0016 — workspaceId NOT NULL (30 tables)", () =>
    applySqlFile("0016_cheerful_dazzler"),
  );
  await step("0018 — drop userId on 5 pure-redundancy tables", () =>
    applySqlFile("0018_modern_the_leader"),
  );
  await step("0019 — rename userId → createdByUserId on 11 tables", () =>
    applySqlFile("0019_wonderful_nightcrawler"),
  );
  await step("Seed drizzle migrations ledger", seedJournal);

  console.log("\n✅ Phase 2 migration complete.");
}

main()
  .then(() => sql.end())
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error("\n❌ Migration failed:", err);
    await sql.end().catch(() => {});
    process.exit(1);
  });
