#!/usr/bin/env bash
# Production Phase-2 migration runbook.
#
# Runs every migration file + backfill in the exact order required by the
# data-dependency chain. Stops at the first failure and prints the step,
# so you can fix-forward without re-running earlier steps.
#
# Prereqs:
#   - $DATABASE_URL exported (or set in .env and `dotenv` loaded by shell)
#   - `psql` on PATH
#   - Run from repo root so scripts/ paths resolve
#
# Idempotency:
#   - Each `psql -f <migration>` will error if already applied (duplicate
#     constraint / column). That's the signal to skip and move on — the
#     script requires clean runs, so take a DB backup first and start
#     fresh if re-running.

set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL not set" >&2
  exit 1
fi

PSQL="psql ${DATABASE_URL} -v ON_ERROR_STOP=1"
DRIZZLE=./drizzle

step() { echo; echo "=== $* ==="; }

# ─── Phase 1 schema ────────────────────────────────────────────────────────
step "0012 — posts status enum audit fields"
$PSQL -f "$DRIZZLE/0012_bent_shinobi_shaw.sql"

step "0013 — post_notes table"
$PSQL -f "$DRIZZLE/0013_amusing_spitfire.sql"

# ─── Phase 2 — workspaces ──────────────────────────────────────────────────
step "0014 — workspaces + workspace_members"
$PSQL -f "$DRIZZLE/0014_natural_mach_iv.sql"

step "backfill-workspaces.ts (one workspace per user)"
bun run scripts/backfill-workspaces.ts

step "0015 — workspaceId on 31 tenant tables + notion renames"
$PSQL -f "$DRIZZLE/0015_old_monster_badoon.sql"

step "0017 — subscriptions.workspaceId"
# Applied before 0016 because 0016 is NOT NULL — must run after backfill.
$PSQL -f "$DRIZZLE/0017_fantastic_firedrake.sql"

step "backfill-workspace-ids.ts (populate workspaceId across tenant tables)"
bun run scripts/backfill-workspace-ids.ts

step "0016 — workspaceId NOT NULL (30 tables)"
$PSQL -f "$DRIZZLE/0016_cheerful_dazzler.sql"

step "0018 — drop userId on 5 pure-redundancy tables"
$PSQL -f "$DRIZZLE/0018_modern_the_leader.sql"

step "0019 — rename userId → createdByUserId on 11 authorship tables"
$PSQL -f "$DRIZZLE/0019_wonderful_nightcrawler.sql"

# ─── Sync the drizzle journal ──────────────────────────────────────────────
# Because we applied via psql, drizzle's __drizzle_migrations ledger is
# blank. Seed it so future `db:migrate` runs don't try to re-apply.
step "Seed __drizzle_migrations ledger"
$PSQL <<'SQL'
CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);
-- Safe to run repeatedly: inserts only rows that aren't there yet.
INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
SELECT v.hash, v.ts
FROM (VALUES
  ('0012_bent_shinobi_shaw', 1776923636943),
  ('0013_amusing_spitfire', 1776923927995),
  ('0014_natural_mach_iv', 1776925399394),
  ('0015_old_monster_badoon', 1776927814252),
  ('0016_cheerful_dazzler', 1776935209981),
  ('0017_fantastic_firedrake', 1776935741468),
  ('0018_modern_the_leader', 1776937437758),
  ('0019_wonderful_nightcrawler', 1776939154501)
) AS v(hash, ts)
WHERE NOT EXISTS (
  SELECT 1 FROM drizzle.__drizzle_migrations m WHERE m.hash = v.hash
);
SQL

echo
echo "✅ Phase 2 migration complete."
